import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEmployeeStore } from "@/stores/employeeStore"; // Đảm bảo đường dẫn chính xác

interface LogoutButtonProps {
  className?: string;
  fullWidth?: boolean;
  label?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  className,
  fullWidth = true,
  label = "Đăng Xuất",
}) => {
  const router = useRouter();
  const setEmployee = useEmployeeStore((state) => state.setEmployee);


  const handleLogout = () => {
    router.push("/auth/login");
    // Xóa token khỏi cookie
    Cookies.remove("authToken");
     // Xóa dữ liệu nhân viên từ store
     setEmployee(null);
     
     if (typeof window !== 'undefined') {
      localStorage.removeItem('employee');
    }
    // Điều hướng đến trang đăng nhập
    setTimeout(() => {
      window.location.reload();
      
    }, 1); // Đợi một chút trước khi tải lại trang
  };

  return (
    <button
      onClick={handleLogout}
      className={`${fullWidth ? "w-full" : "inline-flex items-center"} cursor-pointer rounded-lg border border-primary bg-primary px-4 py-2 text-white transition hover:bg-opacity-90 ${className ?? ""}`}
    >
      {label}
    </button>
  );
};

export default LogoutButton;
