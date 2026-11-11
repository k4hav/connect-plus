"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { SelectWithOther } from "@/components/ui/SelectWithOther";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/community";

type Profile = {
  full_name: string;
  username: string | null;
  college_id: string | null;
  course: string | null;
  branch: string | null;
  academic_year: number | null;
  bio: string | null;
};

export function ProfileForm({ profile, colleges }: { profile: Profile; colleges: { id: string; college_name: string }[] }) {
  return (
    <ActionForm action={updateProfile} submitLabel="Save changes" resetOnSuccess={false}>
      {(e) => (
        <>
          <Input name="full_name" label="Full name" defaultValue={profile.full_name} error={e.full_name} required />
          <Input name="username" label="Username (optional)" defaultValue={profile.username ?? ""} error={e.username} placeholder="letters, numbers, underscore" />
          <SelectWithOther
            name="college_id"
            label="College"
            defaultValue={profile.college_id ?? ""}
            placeholder="Select your college"
            options={colleges.map((c) => ({ value: c.id, label: c.college_name }))}
            optionLabel="+ My college is not listed"
            otherName="new_college"
            otherLabel="Your college name"
            error={e.college_id}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input name="course" label="Course" defaultValue={profile.course ?? ""} placeholder="B.Tech" error={e.course} />
            <Input name="branch" label="Branch" defaultValue={profile.branch ?? ""} error={e.branch} />
            <Input name="academic_year" type="number" min={1} max={6} label="Year" defaultValue={profile.academic_year ?? ""} error={e.academic_year} />
          </div>
          <Textarea name="bio" label="Bio (optional)" rows={3} maxLength={280} defaultValue={profile.bio ?? ""} error={e.bio} />
        </>
      )}
    </ActionForm>
  );
}
