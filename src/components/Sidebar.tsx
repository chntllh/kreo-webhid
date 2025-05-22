import { SidebarProps } from "@/types";
import { Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { BatterySvg } from "./svg/BatterySvg";

export function Sidebar({
  activePanel,
  onSelectPanel,
  panels,
  battery,
  device,
}: SidebarProps) {
  return (
    <Box w="64" bg="gray.900" p={4} display={"flex"} flexDir={"column"}>
      <Box flex={"1"}>
        <Stack gap={4}>
          {panels.map(({ id, label, icon: Icon }) => {
            const isActive = id === activePanel;

            return (
              <Button
                key={id}
                onClick={() => onSelectPanel(id)}
                bg={isActive ? "purple.400" : "gray.100"}
                _hover={{ bg: isActive ? "purple.500" : "gray.200" }}
                justifyContent={"start"}
                gap={6}
              >
                <Icon />
                {label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      <Stack gap="2">
        <HStack display={"flex"}>
          <BatterySvg level={battery} />
          <Text>{battery}%</Text>
        </HStack>
        <Button
          rounded="full"
          bg={"purple.400"}
          onClick={async () => {
            await device.sendUpdates();
            console.log("Updated minama");
          }}
        >
          Save Change
        </Button>
      </Stack>
    </Box>
  );
}
