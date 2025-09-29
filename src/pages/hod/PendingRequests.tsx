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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchTemplates, updateRequestStatus, fetchAllStudentsWithDetails } from "@/data/appData";
import { BonafideRequest, CertificateTemplate, StudentDetails } from "@/lib/types";
import { showSuccess, showError } from "@/utils/toast";
import { formatDateToIndian } from "@/lib/utils";
import RequestDetailsView from "@/components/shared/RequestDetailsView";
import { useSession } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";

const HodPendingRequests = () => {
  const { user, profile, loading: sessionLoading } = useSession();
  const [requests, setRequests] = useState<BonafideRequest[]>([]);
  const [allStudents, setAllStudents] = useState<StudentDetails[]>([]); // Store all student details
  const [selectedRequest, setSelectedRequest] =
    useState<BonafideRequest | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [componentLoading, setComponentLoading] = useState(true); // Renamed to avoid conflict

  const fetchHodRequests = async () => {
    if (sessionLoading) { // Wait for session to load
      return;
    }

    if (!user?.id || !profile?.department_id) { // If no user/profile after session loads, stop loading
      setRequests([]);
      setAllStudents([]);
      setComponentLoading(false);
      return;
    }

    setComponentLoading(true); // Start loading for this component's data
    try {
      // Fetch pending requests for students in HOD's department (RLS will filter)
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'Pending HOD Approval');

      if (requestsError) {
        showError("Error fetching pending requests: " + requestsError.message);
        setRequests([]);
      } else {
        setRequests(requestsData as BonafideRequest[]);
      }

      const fetchedTemplates = await fetchTemplates();
      setTemplates(fetchedTemplates);

      // Fetch all student details for the requests
      const studentIds = requestsData?.map(req => req.student_id) || [];
      if (studentIds.length > 0) {
        const students = await fetchAllStudentsWithDetails(); // This function is now optimized
        setAllStudents(students.filter(s => studentIds.includes(s.id)));
      } else {
        setAllStudents([]);
      }

    } catch (error: any) {
      showError("Failed to fetch HOD pending requests: " + error.message);
      setRequests([]);
      setAllStudents([]);
      setTemplates([]);
    } finally {
      setComponentLoading(false); // Always stop loading
    }
  };

  useEffect(() => {
    fetchHodRequests();
  }, [user, profile?.department_id, sessionLoading]); // Depend on user, profile, and sessionLoading

  const handleForward = async () => {
    if (!selectedRequest || !selectedTemplate) return;
    const updated = await updateRequestStatus(selectedRequest.id, "Pending Principal Approval", undefined);
    if (updated) {
      showSuccess(`Request ${selectedRequest.id} forwarded to Principal.`);
      fetchHodRequests(); // Refresh list
      setIsForwardOpen(false);
      setSelectedRequest(null);
      setSelectedTemplate("");
    } else {
      showError("Failed to forward request.");
    }
  };

  const handleReturn = async () => {
    if (!selectedRequest || !returnReason) return;
    const updated = await updateRequestStatus(selectedRequest.id, "Returned by HOD", returnReason);
    if (updated) {
      showSuccess(`Request ${selectedRequest.id} returned to student.`);
      fetchHodRequests(); // Refresh list
      setIsReturnOpen(false);
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

  if (componentLoading || sessionLoading) { // Show loading if session is loading or component data is loading
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
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewOpen(false);
                setIsReturnOpen(true);
              }}
            >
              Return to Student
            </Button>
            <Button
              onClick={() => {
                setIsReviewOpen(false);
                setIsForwardOpen(true);
              }}
            >
              Forward to Principal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isForwardOpen} onOpenChange={setIsForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Certificate Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="template-select">Template</Label>
            <Select onValueChange={setSelectedTemplate}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleForward} disabled={!selectedTemplate}>
              Forward
            </Button>
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

export default HodPendingRequests;