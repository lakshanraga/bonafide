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
import { fetchStudentDetails } from "@/data/appData"; // Import fetchStudentDetails

const TutorStudents = () => {
  const { user, loading: sessionLoading } = useSession();
  const [assignedStudents, setAssignedStudents] = useState<StudentDetails[]>([]);
  const [componentLoading, setComponentLoading] = useState(true); // Renamed to avoid conflict

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      if (sessionLoading) { // Wait for session to load
        return;
      }

      if (!user?.id) { // If no user after session loads, stop loading and show no students
        setAssignedStudents([]);
        setComponentLoading(false);
        return;
      }

      setComponentLoading(true); // Start loading for this component's data
      try {
        // First, fetch only the IDs of students assigned to this tutor
        const { data: studentIdsData, error: studentIdsError } = await supabase
          .from('students')
          .select('id')
          .eq('tutor_id', user.id);

        if (studentIdsError) {
          showError("Error fetching assigned student IDs: " + studentIdsError.message);
          setAssignedStudents([]);
          return;
        }

        const studentIds = studentIdsData?.map(s => s.id) || [];

        if (studentIds.length === 0) {
          setAssignedStudents([]);
          return;
        }

        // Then, fetch full details for each student using fetchStudentDetails
        const detailedStudentsPromises = studentIds.map(id => fetchStudentDetails(id));
        const detailedStudents = await Promise.all(detailedStudentsPromises);
        setAssignedStudents(detailedStudents.filter(s => s !== null) as StudentDetails[]);
        
      } catch (error: any) {
        showError("Failed to fetch assigned students: " + error.message);
        setAssignedStudents([]);
      } finally {
        setComponentLoading(false); // Always stop loading
      }
    };
    fetchAssignedStudents();
  }, [user, sessionLoading]); // Depend on user and sessionLoading

  if (componentLoading || sessionLoading) { // Show loading if session is loading or component data is loading
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