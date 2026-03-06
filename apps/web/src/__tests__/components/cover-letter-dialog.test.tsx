import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { CoverLetterDialog } from "@/components/ai/cover-letter-dialog";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store = { ...store, [key]: value };
    }),
    removeItem: vi.fn((key: string) => {
      const { [key]: _, ...rest } = store;
      store = rest;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  company: "Acme Corp",
  role: "Software Engineer",
};

function renderDialog(
  overrides: Record<string, unknown> = {},
) {
  return render(
    <CoverLetterDialog {...defaultProps} {...overrides} />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CoverLetterDialog", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("renders with company and role in the description", () => {
    renderDialog();

    expect(screen.getByText("AI Cover Letter Generator")).toBeDefined();
    expect(
      screen.getByText(
        "Generate a tailored cover letter for Software Engineer at Acme Corp",
      ),
    ).toBeDefined();
  });

  it("shows resume and job description textareas", () => {
    renderDialog();

    const resumeTextarea = screen.getByTestId("resume-textarea");
    const jobDescTextarea = screen.getByTestId("job-description-textarea");

    expect(resumeTextarea).toBeDefined();
    expect(jobDescTextarea).toBeDefined();
  });

  it("pre-fills job description from prop", () => {
    renderDialog({ jobDescription: "We are looking for a great engineer" });

    const jobDescTextarea = screen.getByTestId(
      "job-description-textarea",
    ) as HTMLTextAreaElement;
    expect(jobDescTextarea.value).toBe(
      "We are looking for a great engineer",
    );
  });

  it("shows the generate button", () => {
    renderDialog();

    const generateButton = screen.getByTestId("generate-button");
    expect(generateButton).toBeDefined();
    expect(generateButton.textContent).toContain("Generate Cover Letter");
  });

  it("disables generate button when textareas are empty", () => {
    renderDialog();

    const generateButton = screen.getByTestId(
      "generate-button",
    ) as HTMLButtonElement;
    expect(generateButton.disabled).toBe(true);
  });

  it("shows loading state while generating", async () => {
    server.use(
      http.post("/api/ai/cover-letter", async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({
          success: true,
          data: {
            coverLetter: "Dear Hiring Manager...",
            generatedAt: new Date().toISOString(),
          },
        });
      }),
    );

    renderDialog();

    fireEvent.change(screen.getByTestId("resume-textarea"), {
      target: { value: "My resume content here" },
    });
    fireEvent.change(screen.getByTestId("job-description-textarea"), {
      target: { value: "Job description here" },
    });

    const generateButton = screen.getByTestId("generate-button");
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateButton.textContent).toContain(
        "Generating your cover letter...",
      );
    });
  });

  it("displays the generated cover letter on success", async () => {
    server.use(
      http.post("/api/ai/cover-letter", () => {
        return HttpResponse.json({
          success: true,
          data: {
            coverLetter: "Dear Hiring Manager,\n\nI am writing to apply...",
            generatedAt: "2026-03-05T10:00:00Z",
          },
        });
      }),
    );

    renderDialog();

    fireEvent.change(screen.getByTestId("resume-textarea"), {
      target: { value: "My resume content" },
    });
    fireEvent.change(screen.getByTestId("job-description-textarea"), {
      target: { value: "Job description content" },
    });

    fireEvent.click(screen.getByTestId("generate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("cover-letter-output")).toBeDefined();
    });

    expect(screen.getByTestId("cover-letter-output").textContent).toContain(
      "Dear Hiring Manager",
    );

    // Action buttons should be visible
    expect(screen.getByText("Copy")).toBeDefined();
    expect(screen.getByText("Download .txt")).toBeDefined();
    expect(screen.getByText("Regenerate")).toBeDefined();
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.post("/api/ai/cover-letter", () => {
        return HttpResponse.json(
          { error: "Failed to generate cover letter" },
          { status: 500 },
        );
      }),
    );

    renderDialog();

    fireEvent.change(screen.getByTestId("resume-textarea"), {
      target: { value: "Resume text" },
    });
    fireEvent.change(screen.getByTestId("job-description-textarea"), {
      target: { value: "Job desc" },
    });

    fireEvent.click(screen.getByTestId("generate-button"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to generate cover letter"),
      ).toBeDefined();
    });
  });

  it("saves resume text to localStorage", () => {
    renderDialog();

    fireEvent.change(screen.getByTestId("resume-textarea"), {
      target: { value: "My saved resume" },
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "hireagent-resume-text",
      "My saved resume",
    );
  });

  it("loads resume text from localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce("Previously saved resume");

    renderDialog();

    const resumeTextarea = screen.getByTestId(
      "resume-textarea",
    ) as HTMLTextAreaElement;
    expect(resumeTextarea.value).toBe("Previously saved resume");
  });
});
