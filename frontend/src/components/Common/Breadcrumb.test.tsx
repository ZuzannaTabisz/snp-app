import { render, screen } from "@testing-library/react";
import Breadcrumb from "./Breadcrumb";

describe("Breadcrumb", () => {
  it("renders with correct page name and description", () => {
    render(
      <Breadcrumb
        pageName="About Page"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      />
    );

    expect(
      screen.getByRole("heading", { name: "About Page" })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      )
    ).toBeInTheDocument();

    const breadcrumbItem = screen.getByText("About Page", { selector: "li" });
    expect(breadcrumbItem).toBeInTheDocument();
  });
});
