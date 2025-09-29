"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStudent } from "@/data/appData";
import { showError, showSuccess } from "@/utils/toast";
import { Batch, Department, Profile } from "@/lib/types";

const formSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required." }),
  last_name: z.string().optional(),
  username: z.string().min(1, { message: "Username is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone_number: z.string().min(10, { message: "Phone number is required (min 10 digits)." }),
  register_number: z.string().min(1, { message: "Register number is required." }),
  parent_name: z.string().optional(),
  department_id: z.string().min(1, { message: "Department is required." }),
  batch_id: z.string().min(1, { message: "Batch is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

interface AddSingleStudentFormProps {
  departments: Department[];
  batches: Batch[];
  tutors: Profile[];
  hods: Profile[];
  onSuccess: () => void;
  onCancel: () => void;
}

const AddSingleStudentForm = ({
  departments,
  batches,
  tutors,
  hods,
  onSuccess,
  onCancel,
}: AddSingleStudentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      phone_number: "",
      register_number: "",
      parent_name: "",
      department_id: "",
      batch_id: "",
      password: "",
    },
  });

  const selectedDepartmentId = form.watch("department_id");
  const selectedBatchId = form.watch("batch_id");

  const filteredBatches = batches.filter(
    (batch) => batch.department_id === selectedDepartmentId
  );

  useEffect(() => {
    console.log("Dyad Debug: selectedDepartmentId in useEffect:", selectedDepartmentId);
    console.log("Dyad Debug: All batches available to form:", batches);
    console.log("Dyad Debug: Filtered batches for selected department:", filteredBatches);

    if (filteredBatches.length > 0 && !filteredBatches.some(b => b.id === selectedBatchId)) {
      form.setValue("batch_id", filteredBatches[0].id);
    } else if (filteredBatches.length === 0) {
      form.setValue("batch_id", "");
    }
  }, [selectedDepartmentId, filteredBatches, form, selectedBatchId, batches]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const selectedBatch = batches.find(b => b.id === values.batch_id);
    const departmentHod = hods.find(h => h.department_id === values.department_id);

    console.log("Dyad Debug: Form values:", values);
    console.log("Dyad Debug: Selected Department ID:", values.department_id);
    console.log("Dyad Debug: Selected Batch ID:", values.batch_id);
    console.log("Dyad Debug: Resolved Batch (from batches array):", selectedBatch);
    console.log("Dyad Debug: Resolved HOD (from hods array):", departmentHod);
    console.log("Dyad Debug: Tutor ID from selected batch:", selectedBatch?.tutor_id);
    console.log("Dyad Debug: HOD ID from department HOD:", departmentHod?.id);


    const newStudent = await createStudent(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        username: values.username,
        email: values.email,
        phone_number: values.phone_number,
        department_id: values.department_id,
        batch_id: values.batch_id,
        role: 'student',
      },
      {
        register_number: values.register_number,
        parent_name: values.parent_name,
        batch_id: values.batch_id,
        tutor_id: selectedBatch?.tutor_id,
        hod_id: departmentHod?.id,
      },
      values.password
    );

    if (newStudent) {
      showSuccess(`Student ${values.first_name} ${values.last_name || ''} added successfully!`);
      form.reset();
      onSuccess();
    } else {
      showError("Failed to add student.");
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="9876543210" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="register_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Register Number</FormLabel>
                <FormControl>
                  <Input placeholder="123456789" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parent_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent's Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={(value) => {
                    console.log("Dyad Debug: Department Select onValueChange:", value);
                    field.onChange(value);
                  }}
                  value={field.value} // Changed from defaultValue to value
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="batch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch</FormLabel>
                <Select
                  onValueChange={(value) => {
                    console.log("Dyad Debug: Batch Select onValueChange:", value);
                    field.onChange(value);
                  }}
                  value={field.value} // Changed from defaultValue to value
                  disabled={loading || !selectedDepartmentId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {`${batch.name} ${batch.section || ''}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Set initial password"
                      {...field}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-primary/10"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">Toggle password visibility</span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding Student..." : "Add Student"}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

export default AddSingleStudentForm;