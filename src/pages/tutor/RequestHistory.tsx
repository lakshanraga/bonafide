import { useState, useEffect } from "react";
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
import { fetchRequests } from "@/data/appData"; // Keep fetchRequests for all requests
import { getStatusVariant, formatDateToIndian } from "@/lib/utils";
import { BonafideRequest, StudentDetails } from "@/lib/types";
import { useSession } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

const TutorRequestHistory = () => {
  const { user, loading: sessionLoading } = useSession();
  const [allRequests, setAllRequests] = useState<BonafideRequest[]>([]);
  const [allStudentsWithDetails, setAllStudentsWithDetails] = useState<StudentDetails[]>([]); // Store all student details
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [componentLoading, setComponentLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (sessionLoading || !user?.id) {
        setAllRequests([]);
        setAllStudentsWithDetails([]);
        setComponentLoading(false);
        return;
      }

      setComponentLoading(true);
      try {
        // Fetch all students with details assigned to this tutor in a single query
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            *,
            main_profile:profiles!students_id_fkey(id, first_name, last_name, username, email, phone_number, avatar_url, role, department_id, batch_id, created_at, updated_at),
            batches(name, section, current_semester, departments(name)),
            tutor_profile:profiles!students_tutor_id_fkey(id, first_name, last_name),
            hod_profile:profiles!students_hod_id_fkey(id, first_name, last_name)
          `)
          .eq('tutor_id', user.id);

        if (studentsError) {
          showError("Error fetching assigned students for history: " + studentsError.message);
          setAllStudentsWithDetails([]);
          setAllRequests([]);
          return;
        }

        const detailedStudents = studentsData.map((studentRow: any) => {
          const profile = studentRow.main_profile;
          const batch = studentRow.batches;
          const department = batch?.departments;
          const tutor = studentRow.tutor_profile;
          const hod = studentRow.hod_profile;

          return {
            id: studentRow.id,
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            username: profile?.username,
            email: profile?.email,
            phone_number: profile?.phone_number,
            avatar_url: profile?.avatar_url,
            role: profile?.role,
            created_at: profile?.created_at,
            updated_at: profile?.updated_at,

            register_number: studentRow.register_number,
            parent_name: studentRow.parent_name,
            
            batch_id: batch?.id,
            batch_name: batch ? `${batch.name} ${batch.section || ''}`.trim() : undefined,
            current_semester: batch?.current_semester,
            
            department_id: department?.id,
            department_name: department?.name,
            
            tutor_id: tutor?.id,
            tutor_name: tutor ? `${tutor.first_name} ${tutor.last_name || ''}`.trim() : undefined,
            
            hod_id: hod?.id,
            hod_name: hod ? `${hod.first_name} ${hod.last_name || ''}`.trim() : undefined,
          } as StudentDetails;
        });
        setAllStudentsWithDetails(detailedStudents);

        const tutorStudentIds = detailedStudents.map(s => s.id);
        if (tutorStudentIds.length === 0) {
          setAllRequests([]);
          setComponentLoading(false);
          return;
        }

        // Fetch requests for these students, excluding pending tutor approval
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select('*')
          .in('student_id', tutorStudentIds)
          .neq('status', 'Pending Tutor Approval');

        if (requestsError) {
          showError("Error fetching request history: " + requestsError.message);
          setAllRequests([]);
        } else {
          setAllRequests(requestsData as BonafideRequest[]);
        }
      } catch (error: any) {
        showError("Failed to fetch request history: " + error.message);
        setAllRequests([]);
        setAllStudentsWithDetails([]);
      } finally {
        setComponentLoading(false);
      }
    };
    fetchData();
  }, [user, sessionLoading]);

  const filteredHistory = allRequests.filter((request) => {
    if (selectedSemester === "all") return true;
    const student = allStudentsWithDetails.find(
      (s) => s.id === request.student_id
    );
    return student?.current_semester === Number(selectedSemester);
  });

  if (componentLoading || sessionLoading) {
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
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((request) => {
                const student = allStudentsWithDetails.find(
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
                <TableCell colSpan={4} className="text-center">
                  No request history found for the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TutorRequestHistory;