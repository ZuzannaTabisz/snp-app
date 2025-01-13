
import Hero from "@/components/Hero";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SNPsniper",
  description: "This is Home for SNPsniper application",
  // other metadata
};

export default function Home() {
  return (
    <>
      <Hero />
    </>
  );
}
