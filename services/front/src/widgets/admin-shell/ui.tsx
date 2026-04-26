import { AppShell, Avatar, Group, NavLink, Stack, Text } from '@mantine/core';
import { IconCalendar, IconClock, IconLink } from '@tabler/icons-react';
import { NavLink as RouterNavLink, Outlet } from 'react-router-dom';
import { ownerProfile, routes } from '@/shared/config/routes';

const NAV = [
  { to: routes.adminEventTypes, label: 'Event types', icon: IconLink },
  { to: routes.adminBookings, label: 'Bookings', icon: IconCalendar },
  { to: routes.adminAvailability, label: 'Availability', icon: IconClock },
];

export function AdminShell() {
  return (
    <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Group gap="sm" mb="md">
            <Avatar color="indigo" radius="xl">
              {ownerProfile.name.charAt(0)}
            </Avatar>
            <Text fw={600}>{ownerProfile.name}</Text>
          </Group>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              component={RouterNavLink}
              to={to}
              label={label}
              leftSection={<Icon size={18} />}
              variant="filled"
            />
          ))}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
