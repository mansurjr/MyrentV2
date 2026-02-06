import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "./login";
import DashboardPage from "./dashboard";
import OwnersPage from "./owners";
import SaleTypesPage from "./sale-types";
import UsersPage from "./users";
import SectionsPage from "./sections";
import StallsPage from "./stalls";
import StoresPage from "./stores";
import ContractsPage from "./contracts";
import ArchivedOwnersPage from "./owners/archive";
import ArchivedContractsPage from "./contracts/archive";
import TransactionsPage from "./transactions";
import MapPage from "./map";
import AttendancePage from "./attendances";
import NotFoundPage from "./not-found";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

const routes = [
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
    handle: { title: "nav.login" },
  },
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      {
        path: "/dashboard",
        element: <DashboardPage />,
        handle: { title: "nav.dashboard" },
      },
      {
        path: "/sale-types",
        element: <SaleTypesPage />,
        handle: { title: "nav.sale_types" },
      },
      {
        path: "/sections",
        element: <SectionsPage />,
        handle: { title: "nav.sections" },
      },
      {
        path: "/owners",
        element: <OwnersPage />,
        handle: { title: "nav.owners" },
      },
      {
        path: "/owners/archive",
        element: <ArchivedOwnersPage />,
        handle: { title: "nav.owners_archive" },
      },
      {
        path: "/stores",
        element: <StoresPage />,
        handle: { title: "nav.stores" },
      },
      {
        path: "/stalls",
        element: <StallsPage />,
        handle: { title: "nav.stalls" },
      },
      {
        path: "/stalls/:id",
        element: <div>Rasta tafsilotlari</div>,
        handle: { title: "nav.stall_details" },
      },
      {
        path: "/contracts",
        element: <ContractsPage />,
        handle: { title: "nav.contracts" },
      },
      {
        path: "/contracts/archive",
        element: <ArchivedContractsPage />,
        handle: { title: "nav.contracts_archive" },
      },
      {
        path: "/contracts/:id",
        element: <div>Shartnoma tafsilotlari</div>,
        handle: { title: "nav.contract_details" },
      },
      {
        path: "/statistics",
        element: <div>Statistika</div>,
        handle: { title: "nav.statistics" },
      },
      {
        path: "/map",
        element: <MapPage />,
        handle: { title: "nav.map" },
      },
      {
        path: "/reconciliation",
        element: <div>Hisob-kitob</div>,
        handle: { title: "nav.reconciliation" },
      },
      {
        path: "/attendances",
        element: <AttendancePage />,
        handle: { title: "nav.attendances" },
      },
      {
        path: "/transactions",
        element: <TransactionsPage />,
        handle: { title: "nav.transactions" },
      },
      {
        path: "/users",
        element: <UsersPage />,
        handle: { title: "nav.users" },
      },
      {
        path: "*",
        element: <NotFoundPage />,
        handle: { title: "Sahifa topilmadi" },
      },
    ],
  },
];

const AppRouter = () => {
  const router = createBrowserRouter(routes);
  return (
    <RouterProvider router={router} />
  );
};

export default AppRouter;
