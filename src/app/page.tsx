import Home from "./qc/welcome";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QUẢN LÝ KHO HÀNG",
  description: "Thành Trung",
};

export default function Page() {
  return (
    <>
      <Home />
    </>
  );
}
