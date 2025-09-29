import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchRequests, updateRequestStatus, fetchAllStudentsWithDetails } from "@/data/appData";
import { formatDateToIndian } from "@/lib/utils";
import { BonafideRequest, StudentDetails } from "@/lib/types";
import { showSuccess, showError } from "@/utils/toast";
import RequestDetailsView from "@/components/shared/RequestDetailsView";
import { useSession } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";

const TutorPendingRequests = () => {
  const { user } = useSession();
  const [requests, setRequests] = useState<BonafideRequest[]>([]);
  const [allStudents, setAllStudents] = useState<StudentDetails[]>([]); // Store all student details
  const [selectedRequest, setSelectedRequest] =
    useState<BonafideRequest | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTutorRequests = async () => {
    if (user?.id) {
      setLoading(true);
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('tutor_id', user.id);

      if (studentsError) {
        showError("Error fetching assigned students: " + studentsError.message);
        setRequests([]);
        setAllStudents([]);
        setLoading(false);
        return;
      }

      const tutorStudentsIds = studentsData?.map(s => s.id) || [];
      if (tutorStudentsIds.length === 0) {
        setRequests([]);
        setAllStudents([]);
        setLoading(false);
        return;
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'Pending Tutor Approval')
        .in('student_id', tutorStudentsIds);

      if (requestsError) {
        showError("Error fetching pending requests: " + requestsError.message);
        setRequests([]);
      } else {
        setRequests(requestsData as BonafideRequest[]);
      }

      // Fetch all student details for the requests
      const students = await fetchAllStudentsWithDetails(); // This function is now optimized
      setAllStudents(students.filter(s => tutorStudentsIds.includes(s.id)));

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorRequests();
  }, [user]);

  const handleForward = async () => {
    if (!selectedRequest) return;
    const updated = await updateRequestStatus(selectedRequest.id, "Pending HOD Approval");
    if (updated) {
      showSuccess(`Request ${selectedRequest.id} forwarded to HOD.`);
      fetchTutorRequests(); // Refresh list
      setIsReviewOpen(false);
      setSelectedRequest(null);
    } else {
      showError("Failed to forward request.");
    }
  };

  const handleReturn = async () => {
    if (!selectedRequest || !returnReason) return;
    const updated = await updateRequestStatus(selectedRequest.id, "Returned by Tutor", returnReason);
    if (updated) {
      showSuccess(`Request ${selectedRequest.id} returned to student.`);
      fetchTutorRequests(); // Refresh list
      setIsReturnOpen(false);
      setIsReviewOpen(false);
      setReturnReason("");
      setSelectedRequest(null);
    } else {
      showError("Failed to return request.");
    }
  };

  const openReviewDialog = (request: BonafideRequest) => {
    setSelectedRequest(request);
    setIsReviewOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Requests...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we fetch pending requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div>{request.student_id}</div>
                    </TableCell>
                    <TableCell>{formatDateToIndian(request.date)}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openReviewDialog(request)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No pending requests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <RequestDetailsView
              request={selectedRequest}
              student={allStudents.find(s => s.id === selectedRequest.student_id) || null}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnOpen(true)}>
              Return to Student
            </Button>
            <Button onClick={handleForward}>Forward to HOD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Return</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="return-reason">
              Please provide a reason for returning this request.
            </Label>
            <Textarea
              id="return-reason"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleReturn} disabled={!returnReason}>
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TutorPendingRequests;