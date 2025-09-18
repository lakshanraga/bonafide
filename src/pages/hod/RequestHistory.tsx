import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchBatches, fetchStudentDetails } from "@/data/appData";
import { getStatusVariant, formatDateToIndian } from "@/lib/utils";
import { BonafideRequest, Batch, StudentDetails } from "@/lib/types";
import { useSession } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

const HodRequestHistory = () => {
  const { user, profile } = useSession();
  const [allRequests, setAllRequests] = useState<BonafideRequest[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [allStudents, setAllStudents] = useState<StudentDetails[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id && profile?.department_id) {
        setLoading(true);

        // Fetch batches for HOD's department (RLS will filter)
        const { data: batchesData, error: batchesError } = await supabase
          .from('batches')
          .select('id, name, section, current_semester');

        if (batchesError) {
          showError("Error fetching batches for department: " + batchesError.message);
          setAllBatches([]);
          setAllStudents([]);
          setAllRequests([]);
          setLoading(false);
          return;
        }
        setAllBatches(batchesData as Batch[]);

        // Fetch students in HOD's department (RLS will filter)
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            register_number,
            profiles!students_id_fkey(first_name, last_name, email, phone_number),
            batches(current_semester)
          `);

        if (studentsError) {
          showError("Error fetching students for department: " + studentsError.message);
          setAllStudents([]);
          setAllRequests([]);
          setLoading(false);
          return;
        }

        const mappedStudents: StudentDetails[] = studentsData.map((s: any) => ({
          id: s.id,
          register_number: s.register_number,
          first_name: s.profiles.first_name,
          last_name: s.profiles.last_name,
          email: s.profiles.email,
          phone_number: s.profiles.phone_number,
          batch_id: s.batches?.id,
          batch_name: s.batches ? `${s.batches.name} ${s.batches.section || ''}`.trim() : 'N/A',
          current_semester: s.batches?.current_semester,
          role: 'student', // Added missing role property
        }));
        setAllStudents(mappedStudents);

        // Fetch requests for these students, excluding pending tutor approval (RLS will filter)
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select('*')
          .neq('status', 'Pending HOD Approval')
          .neq('status', 'Pending Tutor Approval'); // HOD doesn't see tutor pending either

        if (requestsError) {
          showError("Error fetching request history: " + requestsError.message);
          setAllRequests([]);
        } else {
          setAllRequests(requestsData as BonafideRequest[]);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [user, profile?.department_id]);

  const uniqueBatches = useMemo(() => {
    const batchNames = allBatches.map((b) =>
      b.section ? `${b.name} ${b.section}` : b.name
    );
    return [...new Set(batchNames)];
  }, [allBatches]);

  const filteredHistory = allRequests.filter((request) => {
    const student = allStudents.find(
      (s) => s.id === request.student_id
    );
    if (!student) return false;

    const batchMatch =
      selectedBatch === "all" || student.batch_name === selectedBatch;
    const semesterMatch =
      selectedSemester === "all" ||
      student.current_semester === Number(selectedSemester);

    return batchMatch && semesterMatch;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Request History...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we fetch the request history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Request History</CardTitle>
        <div className="flex items-center gap-2">
          <Select onValueChange={setSelectedBatch} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {uniqueBatches.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedSemester} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <SelectItem key={sem} value={String(sem)}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((request) => {
                const student = allStudents.find(
                  (s) => s.id === request.student_id
                );
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div>{student ? `${student.first_name} ${student.last_name || ''}`.trim() : "N/A"}</div>
                      <div className="text-xs text-muted-foreground">
                        [{student?.register_number || "N/A"}]
                      </div>
                    </TableCell>
                    <TableCell>{student?.batch_name || "N/A"}</TableCell>
                    <TableCell>{student?.current_semester || "N/A"}</TableCell>
                    <TableCell>{formatDateToIndian(request.date)}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No request history found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default HodRequestHistory;