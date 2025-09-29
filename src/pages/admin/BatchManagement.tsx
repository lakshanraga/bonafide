import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Batch, Department, Profile } from "@/lib/types";
import {
  calculateCurrentSemesterForBatch,
  getSemesterDateRange,
  formatDateToIndian,
} from "@/lib/utils";
import { createBatch, fetchBatches, fetchDepartments, fetchProfiles, updateBatch } from "@/data/appData";
import { supabase } from "@/integrations/supabase/client";

const BatchManagement = () => {
  const [allBatches, setAllBatches] = useState<Batch[]>([]); // Renamed to allBatches
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSemesterDialogOpen, setIsSemesterDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatch, setNewBatch] = useState<Partial<Batch>>({
    name: "",
    total_sections: 1,
    department_id: "",
  });
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("all");
  const [selectedBatchNameFilter, setSelectedBatchNameFilter] = useState("all");

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const fetchedBatches = await fetchBatches();
      const fetchedDepartments = await fetchDepartments();
      const fetchedTutors = await fetchProfiles('tutor');

      // Deduplicate fetched batches based on department_id, name, and section
      const seen = new Set<string>();
      const uniqueFetchedBatches: Batch[] = [];
      for (const batch of fetchedBatches) {
        const key = `${batch.department_id}-${batch.name}-${batch.section || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueFetchedBatches.push(batch);
        }
      }
      
      // Process unique batches to update semester info if needed
      const updatedBatches = uniqueFetchedBatches.map((batch) => {
        const fullBatchName = batch.section
          ? `${batch.name} ${batch.section}`
          : batch.name;
        const currentSemester = calculateCurrentSemesterForBatch(fullBatchName);
        const { from, to } = getSemesterDateRange(fullBatchName, currentSemester);
        return {
          ...batch,
          current_semester: currentSemester,
          semester_from_date: from,
          semester_to_date: to,
        };
      });

      setAllBatches(updatedBatches); // Set to allBatches
      setDepartments(fetchedDepartments);
      setTutors(fetchedTutors);
    } catch (error: any) {
      showError(error.message);
      setAllBatches([]); // Clear data on error
      setDepartments([]);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Memoized filtered batches
  const filteredBatches = useMemo(() => {
    return allBatches.filter((batch) => {
      const departmentMatch =
        selectedDepartmentFilter === "all" || batch.departments?.name === selectedDepartmentFilter;
      const batchNameMatch =
        selectedBatchNameFilter === "all" || batch.name === selectedBatchNameFilter;
      return departmentMatch && batchNameMatch;
    });
  }, [allBatches, selectedDepartmentFilter, selectedBatchNameFilter]);

  // Unique batch names for the filter dropdown
  const uniqueBatchNames = useMemo(() => {
    const names = allBatches.map(batch => batch.name);
    return [...new Set(names)];
  }, [allBatches]);

  const handleToggleStatus = async (batchId: string) => {
    const batchToUpdate = allBatches.find((b) => b.id === batchId);
    if (!batchToUpdate) return;

    const newStatus = batchToUpdate.status === "Active" ? "Inactive" : "Active";
    const updated = await updateBatch(batchId, { status: newStatus });

    if (updated) {
      showSuccess(`Batch "${batchToUpdate.name} ${batchToUpdate.section || ''}" marked as ${newStatus}.`);
      fetchAllData(); // Refresh data
    } else {
      showError("Failed to update batch status.");
    }
  };

  const handleOpenEditDialog = (batch: Batch) => {
    setEditingBatch({ ...batch });
    setIsEditDialogOpen(true);
  };

  const handleOpenSemesterDialog = (batch: Batch) => {
    setEditingBatch({ ...batch });
    setIsSemesterDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!editingBatch) return;

    const originalBatch = allBatches.find((b) => b.id === editingBatch.id);
    if (!originalBatch) return;

    const oldTotalSections = originalBatch.total_sections || 1;
    const newTotalSections = editingBatch.total_sections || 1;
    const batchName = editingBatch.name;
    const departmentId = editingBatch.department_id;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Update total_sections for ALL sections of this batch name and department
    const { error: updateAllError } = await supabase
      .from('batches')
      .update({ total_sections: newTotalSections })
      .eq('name', batchName)
      .eq('department_id', departmentId);

    if (updateAllError) {
      showError("Failed to update total sections for all batch sections: " + updateAllError.message);
      return;
    }

    // Logic to add/remove sections based on total_sections change
    if (newTotalSections > oldTotalSections) {
      for (let i = oldTotalSections; i < newTotalSections; i++) {
        const sectionName = alphabet[i];
        const fullBatchName = `${batchName} ${sectionName}`;
        const currentSemester = calculateCurrentSemesterForBatch(fullBatchName);
        const { from, to } = getSemesterDateRange(fullBatchName, currentSemester);
        const newSection: Omit<Batch, 'id' | 'created_at'> = {
          name: batchName,
          section: sectionName,
          tutor_id: null, // Unassigned by default
          total_sections: newTotalSections,
          student_count: 0,
          status: "Active",
          current_semester: currentSemester,
          semester_from_date: from,
          semester_to_date: to,
          department_id: departmentId,
        };
        await createBatch(newSection);
      }
    } else if (newTotalSections < oldTotalSections) {
      // Remove excess sections
      const sectionsToRemove = allBatches.filter(b =>
        b.name === batchName &&
        b.department_id === departmentId &&
        b.section &&
        alphabet.indexOf(b.section) >= newTotalSections
      );
      for (const section of sectionsToRemove) {
        await supabase.from('batches').delete().eq('id', section.id);
      }
    }

    showSuccess(`Batch "${editingBatch.name}" updated successfully.`);
    setIsEditDialogOpen(false);
    setEditingBatch(null);
    fetchAllData(); // Refresh all data
  };

  const handleSaveSemesterChanges = async () => {
    if (!editingBatch) return;

    const updated = await updateBatch(editingBatch.id, {
      tutor_id: editingBatch.tutor_id === "unassigned-tutor" ? null : editingBatch.tutor_id, // Handle "Unassigned" value
      current_semester: editingBatch.current_semester,
      semester_from_date: editingBatch.semester_from_date,
      semester_to_date: editingBatch.semester_to_date,
    });

    if (updated) {
      showSuccess(
        `Semester details for "${editingBatch.name} ${
          editingBatch.section || ""
        }" updated successfully.`
      );
      setIsSemesterDialogOpen(false);
      setEditingBatch(null);
      fetchAllData(); // Refresh data
    } else {
      showError("Failed to update semester details.");
    }
  };

  const handleAddNewBatch = async () => {
    const { name: batchName, total_sections, department_id } = newBatch;

    if (!batchName || !department_id) {
      showError("Batch name and Department are required.");
      return;
    }

    // Check if a batch with this name and department already exists
    const { data: existingBatches, error: fetchError } = await supabase
      .from('batches')
      .select('id')
      .eq('name', batchName)
      .eq('department_id', department_id);

    if (fetchError) {
      showError("Error checking for existing batches: " + fetchError.message);
      return;
    }

    if (existingBatches && existingBatches.length > 0) {
      showError(`A batch named "${batchName}" already exists in this department. Please use the 'Edit Batch Details' option for an existing section to modify its total sections.`);
      return;
    }

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const newSectionsToCreate: Omit<Batch, 'id' | 'created_at'>[] = [];

    for (let i = 0; i < (total_sections || 1); i++) {
      const sectionName = (total_sections || 1) > 1 ? alphabet[i] : undefined;
      const fullBatchName = sectionName
        ? `${batchName} ${sectionName}`
        : batchName;
      const currentSemester = calculateCurrentSemesterForBatch(fullBatchName);
      const { from, to } = getSemesterDateRange(fullBatchName, currentSemester);

      newSectionsToCreate.push({
        name: batchName,
        section: sectionName,
        tutor_id: null, // Unassigned by default
        total_sections: total_sections || 1,
        student_count: 0,
        status: "Active",
        current_semester: currentSemester,
        semester_from_date: from,
        semester_to_date: to,
        department_id: department_id,
      });
    }

    const { error } = await supabase.from('batches').insert(newSectionsToCreate);

    if (error) {
      showError("Failed to create new batch: " + error.message);
    } else {
      showSuccess(
        `Batch "${batchName}" with ${total_sections} section(s) created successfully.`
      );
      setIsAddDialogOpen(false);
      setNewBatch({ name: "", total_sections: 1, department_id: "" });
      fetchAllData(); // Refresh all data
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Batches...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we fetch batch data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Batch Management</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select onValueChange={setSelectedDepartmentFilter} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSelectedBatchNameFilter} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Batch Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batch Names</SelectItem>
                {uniqueBatchNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Batch</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Batch</DialogTitle>
                  <DialogDescription>Enter the details for the new batch. This will create a new academic year entry and its initial sections.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-batch-department">Department</Label>
                    <Select
                      value={newBatch.department_id}
                      onValueChange={(value) =>
                        setNewBatch({ ...newBatch, department_id: value })
                      }
                      required
                    >
                      <SelectTrigger id="new-batch-department">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-batch-name">
                      Batch (e.g., 2024-2028)
                    </Label>
                    <Input
                      id="new-batch-name"
                      value={newBatch.name}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-total-sections">Total Sections</Label>
                    <Input
                      id="new-total-sections"
                      type="number"
                      min="1"
                      value={newBatch.total_sections}
                      onChange={(e) =>
                        setNewBatch({
                          ...newBatch,
                          total_sections: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleAddNewBatch}>Create Batch</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Assigned Tutor</TableHead>
                <TableHead>Current Sem</TableHead>
                <TableHead>Semester Start</TableHead>
                <TableHead>Semester End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => { // Iterate over filteredBatches
                const department = departments.find(
                  (d) => d.id === batch.department_id
                );
                const assignedTutor = tutors.find(t => t.id === batch.tutor_id);

                return (
                  <TableRow key={batch.id}> {/* Use batch.id as key */}
                    <TableCell>{department?.name || "N/A"}</TableCell>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>{batch.section || "N/A"}</TableCell> {/* Display section directly */}
                    <TableCell>{assignedTutor ? `${assignedTutor.first_name} ${assignedTutor.last_name || ''}`.trim() : "Unassigned"}</TableCell>
                    <TableCell>{batch.current_semester}</TableCell>
                    <TableCell>
                      {formatDateToIndian(batch.semester_from_date)}
                    </TableCell>
                    <TableCell>
                      {formatDateToIndian(batch.semester_to_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          batch.status === "Active"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleOpenEditDialog(batch)
                            }
                          >
                            Edit Batch Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleOpenSemesterDialog(batch)
                            }
                          >
                            Edit Semester
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(batch.id)
                            }
                          >
                            {batch.status === "Active"
                              ? "Mark as Inactive"
                              : "Mark as Active"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Batch: {editingBatch?.name} {editingBatch?.section}
            </DialogTitle>
            <DialogDescription>Adjust the details for this batch section. Changing 'Total Sections' will affect all sections of this batch name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={
                  departments.find((d) => d.id === editingBatch?.department_id)
                    ?.name || "N/A"
                }
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-sections">Total Sections for Batch</Label>
              <Input
                id="total-sections"
                type="number"
                min="1"
                value={editingBatch?.total_sections || ""}
                onChange={(e) =>
                  setEditingBatch((prev) =>
                    prev
                      ? { ...prev, total_sections: Number(e.target.value) }
                      : null
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSemesterDialogOpen}
        onOpenChange={setIsSemesterDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Semester: {editingBatch?.name} - {editingBatch?.section}
            </DialogTitle>
            <DialogDescription>Update the academic semester and tutor assignment for this section.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-tutor">Assign Tutor</Label>
              <Select
                value={editingBatch?.tutor_id || "unassigned-tutor"} // Ensure value is always a string
                onValueChange={(value) =>
                  setEditingBatch((prev) =>
                    prev ? { ...prev, tutor_id: value === "unassigned-tutor" ? null : value } : null
                  )
                }
              >
                <SelectTrigger id="edit-tutor">
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned-tutor">Unassigned</SelectItem>
                  {tutors
                    .filter(
                      (tutor) =>
                        tutor.department_id === editingBatch?.department_id
                    )
                    .map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {`${tutor.first_name} ${tutor.last_name || ''}`.trim()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current-semester">Current Semester</Label>
              <Select
                value={String(editingBatch?.current_semester || "")}
                onValueChange={(value) =>
                  setEditingBatch((prev) =>
                    prev ? { ...prev, current_semester: Number(value) } : null
                  )
                }
              >
                <SelectTrigger id="current-semester">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={String(sem)}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="from-date">Semester Start Date</Label>
              <Input
                id="from-date"
                type="date"
                value={editingBatch?.semester_from_date || ""}
                onChange={(e) =>
                  setEditingBatch((prev) =>
                    prev ? { ...prev, semester_from_date: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to-date">Semester End Date</Label>
              <Input
                id="to-date"
                type="date"
                value={editingBatch?.semester_to_date || ""}
                onChange={(e) =>
                  setEditingBatch((prev) =>
                    prev ? { ...prev, semester_to_date: e.target.value } : null
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveSemesterChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchManagement;