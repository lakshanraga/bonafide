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
import { useSession } from "@/components/auth/SessionContextProvider";
import { useEffect, useState } from "react";
import { StudentDetails } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

const TutorStudents = () => {
  const { user } = useSession();
  const [assignedStudents, setAssignedStudents] = useState<StudentDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      if (user?.id) {
        setLoading(true);
        const { data, error } = await supabase
          .from('students')
          .select(`
            id,
            register_number,
            profiles!students_id_fkey(first_name, last_name, email, phone_number),
            batches(name, section)
          `)
          .eq('tutor_id', user.id);

        if (error) {
          showError("Error fetching assigned students: " + error.message);
          setAssignedStudents([]);
        } else {
          const mappedStudents: StudentDetails[] = data.map((s: any) => ({
            id: s.id,
            register_number: s.register_number,
            first_name: s.profiles.first_name,
            last_name: s.profiles.last_name,
            email: s.profiles.email,
            phone_number: s.profiles.phone_number,
            batch_name: s.batches ? `${s.batches.name} ${s.batches.section || ''}`.trim() : 'N/A',
            role: 'student', // Added missing role property
          }));
          setAssignedStudents(mappedStudents);
        }
        setLoading(false);
      }
    };
    fetchAssignedStudents();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Students...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we fetch your assigned students.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Students</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Register No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone Number</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedStudents.length > 0 ? (
              assignedStudents.map((student) => (
                <TableRow key={student.register_number}>
                  <TableCell className="font-medium">
                    {student.register_number}
                  </TableCell>
                  <TableCell>{`${student.first_name} ${student.last_name || ''}`.trim()}</TableCell>
                  <TableCell>{student.batch_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone_number}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No students assigned.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TutorStudents;