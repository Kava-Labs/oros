import { render, screen, fireEvent } from "@testing-library/react";
import { Mock } from "vitest";
import { PromptInput } from "./PromptInput";
import { useSelector } from "react-redux";
import { selectHasToolCallInProgress } from "../../../stores";

vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
}));

describe("PromptInput Component", () => {
  const mockSubmitUserMessage = vi.fn();
  const mockCancelStream = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("renders input field and submit button", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={null}
      />
    );

    expect(
      screen.getByPlaceholderText("Enter your prompt here...")
    ).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("updates input value on change", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={null}
      />
    );

    const inputElement = screen.getByPlaceholderText(
      "Enter your prompt here..."
    ) as HTMLInputElement;

    fireEvent.change(inputElement, { target: { value: "Hello" } });
    expect(inputElement.value).toBe("Hello");
  });

  it("calls submitUserMessage on form submit and clears input", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={null}
      />
    );

    const inputElement = screen.getByPlaceholderText(
      "Enter your prompt here..."
    ) as HTMLInputElement;
    const formElement = screen.getByRole("form");

    fireEvent.change(inputElement, { target: { value: "Test message" } });
    fireEvent.submit(formElement);

    expect(mockSubmitUserMessage).toHaveBeenCalledWith("Test message");
    expect(inputElement.value).toBe("");
  });

  it("calls cancelStream when cancel button is clicked", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={mockCancelStream}
      />
    );

    const buttonElement = screen.getByText("Cancel");
    fireEvent.click(buttonElement);

    expect(mockCancelStream).toHaveBeenCalled();
    expect(mockSubmitUserMessage).not.toHaveBeenCalled();
  });

  it("calls submitUserMessage when submit button is clicked and input is not empty", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={null}
      />
    );

    const inputElement = screen.getByPlaceholderText(
      "Enter your prompt here..."
    ) as HTMLInputElement;
    const buttonElement = screen.getByText("Submit");

    fireEvent.change(inputElement, { target: { value: "Hello" } });
    fireEvent.click(buttonElement);

    expect(mockSubmitUserMessage).toHaveBeenCalledWith("Hello");
    expect(inputElement.value).toBe("");
  });

  it("does not call submitUserMessage when input is empty", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={null}
      />
    );

    const buttonElement = screen.getByText("Submit");

    fireEvent.click(buttonElement);

    expect(mockSubmitUserMessage).not.toHaveBeenCalled();
  });

  it("renders Cancel button when cancelStream is provided", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={mockCancelStream}
      />
    );

    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders Submit button when cancelStream is null", () => {
    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={null}
      />
    );

    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("disables the Submit button when there is a tool_call in progress", () => {
    (useSelector as unknown as Mock).mockImplementation((selector) => {
      if (selector === selectHasToolCallInProgress) {
        return true;
      }
    });

    render(
      <PromptInput
        submitUserMessage={mockSubmitUserMessage}
        cancelStream={null}
      />
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
