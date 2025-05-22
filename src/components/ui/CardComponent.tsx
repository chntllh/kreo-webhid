import { Box, Card } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export const CardComponent = ({
  title,
  width = 500,
  children,
}: PropsWithChildren<{ title?: string; width?: number }>) => {
  return (
    <Box width={width} colorPalette={"purple"}>
      <Card.Root variant="subtle" bg="gray.900" mb={6}>
        <Card.Body>
          {title && (
            <Card.Title color={"white"} mb={4}>
              {title}
            </Card.Title>
          )}

          {children}
        </Card.Body>
      </Card.Root>
    </Box>
  );
};
