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
  const { user, loading: sessionLoading } = useSession();
  const [assignedStudents, setAssignedStudents] = useState<StudentDetails[]>([]);
  const [componentLoading, setComponentLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      if (sessionLoading || !user?.id) {
        setAssignedStudents([]);
        setComponentLoading(false);
        return;
      }

      setComponentLoading(true);
      try {
        // Directly fetch all details for students assigned to this tutor in a single query
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            main_profile:profiles!students_id_fkey(id, first_name, last_name, username, email, phone_number, avatar_url, role, department_id, batch_id, created_at, updated_at),
            batches(name, section, current_semester, departments(name)),
            tutor_profile:profiles!students_tutor_id_fkey(id, first_name, last_name),
            hod_profile:profiles!students_hod_id_fkey(id, first_name, last_name)
          `)
          .eq('tutor_id', user.id);

        if (error) {
          showError("Error fetching assigned students: " + error.message);
          setAssignedStudents([]);
          return;
        }

        const detailedStudents = data.map((studentRow: any) => {
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
        setAssignedStudents(detailedStudents);
        
      } catch (error: any) {
        showError("Failed to fetch assigned students: " + error.message);
        setAssignedStudents([]);
      } finally {
        setComponentLoading(false);
      }
    };
    fetchAssignedStudents();
  }, [user, sessionLoading]);

  if (componentLoading || sessionLoading) {
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