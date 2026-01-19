import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from '@/shared/application/providers/tanstack-query'
import { rootRoute } from '@/shared/presentation/routing/root'
import { publicRouting, homeRoute, aboutRoute } from '@/features/public/presentation/routing'

import { authRoute, signInRoute, signUpRoute, forgotPasswordRoute, resetPasswordRoute, verifyEmailRoute } from '@/features/auth/presentation/routing'
import { appRoute, dashboardRoute } from '@/features/app/presentation/routing'
import { usersRoute, usersIndexRoute } from '@/features/users/presentation/routing'
import { tenantsRoute, tenantsIndexRoute } from '@/features/tenants/presentation/routing'
import { settingsRoute, settingsIndexRoute } from '@/features/settings/presentation/routing'

// Configure nested routes and create route tree
const routeTree = rootRoute.addChildren([
  publicRouting.addChildren([
    homeRoute,
    aboutRoute,
  ]),
  authRoute.addChildren([
    signInRoute,
    signUpRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    verifyEmailRoute,
  ]),
  appRoute.addChildren([
    dashboardRoute,
    usersRoute.addChildren([
      usersIndexRoute,
    ]),
    tenantsRoute.addChildren([
      tenantsIndexRoute,
    ]),
    settingsRoute.addChildren([
      settingsIndexRoute,
    ]),
  ]),
])

// Create a new router instance
export function getRouter() {
  const rqContext = TanstackQuery.getContext()

  const router = createTanStackRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          {props.children}
        </TanstackQuery.Provider>
      )
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}

// Register key types
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
