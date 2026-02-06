import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import baseApi from "../../api";

interface ICredentials {
  email: string;
  password: string;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading, error: userError } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await baseApi.get("/auth/me");
      return response.data;
    },
    retry: false,
    enabled : !!localStorage.getItem("accessToken"),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: ICredentials) => {
      const response = await baseApi.post("/auth/signin", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      queryClient.setQueryData(["me"], data.user);
      navigate("/dashboard");
    },
  });

  const logout = async () => {
    try {
      await baseApi.post("/auth/signout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      queryClient.clear();
      navigate("/login");
    }
  };

  return {
    user,
    isLoading: loginMutation.isPending || isUserLoading,
    isUserLoading,
    userError,
    login: loginMutation.mutate,
    logout,
  };
};
