import { AppShell, NavLink, Box, Text, Group, Anchor } from '@mantine/core';
import { IconCalendarEvent, IconCalendar, IconBook, IconExternalLink } from '@tabler/icons-react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <AppShell
      navbar={{
        width: 240,
        breakpoint: 'sm',
      }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <Box mb="xl">
          <Text fw={700} size="lg">Book a Call</Text>
          <Text c="dimmed" size="xs">Admin Panel</Text>
        </Box>

        <NavLink
          component={RouterNavLink}
          to="/admin/events"
          label="Типы событий"
          leftSection={<IconCalendarEvent size={18} />}
          active={location.pathname.startsWith('/admin/events')}
          color="blue"
        />
        <NavLink
          label="Бронирования"
          leftSection={<IconBook size={18} />}
          disabled
          c="dimmed"
        />
        <NavLink
          label="Расписание"
          leftSection={<IconCalendar size={18} />}
          disabled
          c="dimmed"
        />

        <Box mt="auto">
          <Anchor
            href="/"
            target="_blank"
            c="dimmed"
            size="sm"
          >
            <Group gap={4}>
              <IconExternalLink size={14} />
              <Text size="sm">Открыть публичную страницу</Text>
            </Group>
          </Anchor>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
