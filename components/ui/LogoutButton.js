"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { RiLogoutBoxLine } from "react-icons/ri";
import Button from "./Button";

/**
 * Reusable Logout Button component
 * Handles user logout and redirects to the specified route
 * @param {Object} props - LogoutButton props
 * @param {string} props.redirectTo - Route to redirect after logout (default: "/")
 * @param {string} props.size - Button size (small, middle, large)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional Button props
 */
export default function LogoutButton({
  redirectTo = "/",
  size = "middle",
  className = "",
  ...rest
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(redirectTo);
  };

  return (
    <Button
      type="primary"
      danger
      icon={<RiLogoutBoxLine />}
      onClick={handleLogout}
      size={size}
      className={className}
      {...rest}
    >
      Cerrar Sesión
    </Button>
  );
}

