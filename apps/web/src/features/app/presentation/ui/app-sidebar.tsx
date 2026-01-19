import { UserInfo } from "./user-info";
import { AppNavigation } from "./app-navigation";
import { useAppStore } from "@/shared/application/stores/app-store";
import { SignOut } from "./signout";

export function AppSidebar() {
    const { sidebarOpen } = useAppStore();

    return (
        <aside
            className={`fixed left-0 top-[73px] z-40 flex h-[calc(100vh-73px)] w-64 flex-col border-r border-border/40 bg-background/95 backdrop-blur-xl transition-transform duration-300 lg:relative lg:top-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
        >
            <UserInfo />
            <AppNavigation />
            <SignOut />
        </aside>
    )

}