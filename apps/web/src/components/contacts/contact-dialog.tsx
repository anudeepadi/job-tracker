"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createContactSchema } from "@/lib/validations/contacts";
import { toast } from "sonner";
import { z } from "zod";

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "referral", label: "Referral" },
  { value: "networking", label: "Networking" },
  { value: "cold", label: "Cold Outreach" },
  { value: "event", label: "Event" },
] as const;

type ContactFormData = z.input<typeof createContactSchema>;

interface Contact {
  id: string;
  name: string;
  company?: string | null;
  role?: string | null;
  email?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  notes?: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaved: () => void;
  readonly contact?: Contact | null;
}

export function ContactDialog({
  open,
  onOpenChange,
  onSaved,
  contact,
}: ContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(contact);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      name: "",
      company: "",
      role: "",
      email: "",
      linkedinUrl: "",
      phone: "",
      notes: "",
      source: "manual",
    },
  });

  const currentSource = watch("source");

  useEffect(() => {
    if (open && contact) {
      reset({
        name: contact.name,
        company: contact.company ?? "",
        role: contact.role ?? "",
        email: contact.email ?? "",
        linkedinUrl: contact.linkedinUrl ?? "",
        phone: contact.phone ?? "",
        notes: contact.notes ?? "",
        source: (contact.source as ContactFormData["source"]) ?? "manual",
      });
    } else if (open && !contact) {
      reset({
        name: "",
        company: "",
        role: "",
        email: "",
        linkedinUrl: "",
        phone: "",
        notes: "",
        source: "manual",
      });
    }
  }, [open, contact, reset]);

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const url = isEditing ? `/api/contacts/${contact!.id}` : "/api/contacts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save contact");
      }

      toast.success(
        isEditing
          ? "Contact updated successfully"
          : "Contact added successfully",
      );
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving contact:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save contact";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this contact's information"
              : "Add a new networking contact to your tracker"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Jane Smith"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="e.g. Google"
              />
              {errors.company && (
                <p className="text-sm text-destructive">
                  {errors.company.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                {...register("role")}
                placeholder="e.g. Engineering Manager"
              />
              {errors.role && (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                {...register("email")}
                placeholder="jane@company.com"
                type="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              {...register("linkedinUrl")}
              placeholder="https://linkedin.com/in/janesmith"
            />
            {errors.linkedinUrl && (
              <p className="text-sm text-destructive">
                {errors.linkedinUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              value={currentSource}
              onValueChange={(value) =>
                setValue("source", value as ContactFormData["source"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="How did you meet?" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any relevant notes about this contact..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                  ? "Save Changes"
                  : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
