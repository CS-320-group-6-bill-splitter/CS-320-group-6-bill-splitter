"use client";

import { useState } from "react";

type User = {
  name: string;
  households: string[];
};

export default function UserProfile({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>
        User Profile
      </button>

      {open && (
        <div>
          <p>Name: {user.name}</p>
          <p>Households:</p>
          <ul>
            {user.households.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>

          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}