import { AppShell, Container, Text, Group, Anchor } from '@mantine/core';
import { IconCalendarEvent } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 50 }} padding="md">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" align="center">
            <Anchor component={Link} to="/" underline="never">
              <Group gap="xs">
                <IconCalendarEvent size={24} color="blue" />
                <Text fw={700} size="lg">Book a Call</Text>
              </Group>
            </Anchor>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="xl">
          {children}
        </Container>
      </AppShell.Main>

      <AppShell.Footer>
        <Container size="lg" h="100%">
          <Group h="100%" justify="center">
            <Text c="dimmed" size="sm">
              © 2026 Book a Call. Все права защищены.
            </Text>
          </Group>
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}
