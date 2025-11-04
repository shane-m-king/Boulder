import toast from "react-hot-toast";

export const toastAction = async <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error?: string | ((err: any) => string);
  }
): Promise<T | undefined> => {
  try {
    return await toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error:
        typeof messages.error === "function"
          ? messages.error
          : messages.error || "Something went wrong",
    });
  } catch (error) {
    console.error("ToastAction error:", error);
    return undefined;
  }
};
