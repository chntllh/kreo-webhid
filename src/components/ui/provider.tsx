"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";
import { Provider as ReduxProvider } from "react-redux";
import store from "@/store";

export function Provider(props: ColorModeProviderProps) {
  return (
    <ReduxProvider store={store}>
      <ChakraProvider value={defaultSystem}>
        <ColorModeProvider {...props} />
      </ChakraProvider>
    </ReduxProvider>
  );
}
