
"use client";
 
import UserProfile from "@/components/ui/UserProfile";
import CreateBill from "@/components/ui/CreateBill";
 
//replace with fetch to  GET /api/auth/me/ 
const fakeUser = {
  name: "Bob",
  households: ["Brandywine 1305", "Summer sublet 1207"],
};
 
// replace with fetch to GET /api/households/{id}/members/
const fakeMembers = [
  { name: "John" },
  { name: "Bob" },
  { name: "Alex" },
    { name: "Rose" },
];
 
export default function TestPage() {
  return (
    <div>
      <UserProfile user={fakeUser} />
      <CreateBill
        members={fakeMembers}
        onSave={(bill) => {
          // replace with fetch('/api/bills/', { method: 'POST', body: JSON.stringify(bill) })
           //Pass onSave to CreateBill to POST /api/bills/ with the split data
          console.log("Bill to save:", bill);
        }}
      />
    </div>
  );
}
 
