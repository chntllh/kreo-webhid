import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Sidebar } from "./components/Sidebar";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./store";
import { setCurrentDevice } from "./store/slices/devicesSlice";
import { useKreoDevice } from "./context/useKreoDevice";
import { KreoDevice } from "./api/HIDDevice";
import DPIProfilePanel from "./components/panels/DPIProfilePanel";
import { PerformancePanel } from "./components/panels/PerformancePanel";
import { RGBPanel } from "./components/panels/RGBPanel";
import { KeymapPanel } from "./components/panels/KeymapPanel";
import { FiKey, FiSun, FiTarget, FiTrendingUp } from "react-icons/fi";
import { Panel } from "./types";

function App() {
  const dispatch = useDispatch();
  const { device, setDevice, requestDevice } = useKreoDevice();

  const [activePanel, setActivePanel] = useState("");
  const [battery, setBattery] = useState<number | null>(null);

  const currentDeviceId = useSelector(
    (state: RootState) => state.devices.currentDeviceId,
  );

  const handleConnect = async () => {
    try {
      const device = await KreoDevice.connect();
      const deviceId = `${device.device.vendorId}-${device.device.productId}`;

      dispatch(setCurrentDevice(deviceId));

      setDevice(device);
    } catch (err) {
      throw Error(`Device connection failed: ${err}`);
    }
  };

  useEffect(() => {
    if (!device) return;

    let isMounted = true;

    const fetchBattery = async () => {
      try {
        const level = await device.getBatteryLevel();
        if (isMounted) setBattery(level);
      } catch (err) {
        console.error("Failed to get battery level:", err);
        if (isMounted) setBattery(null);
      }
    };

    fetchBattery();

    return () => {
      isMounted = false;
    };
  }, [device]);

  const availablePanels: Panel[] = [
    { id: "performance", label: "Performance", icon: FiTrendingUp },
    { id: "dpi", label: "DPI", icon: FiTarget },
    { id: "rgb", label: "RGB", icon: FiSun },
    { id: "keymapping", label: "Keymapping", icon: FiKey },
  ];

  const joke = useMemo(() => {
    const jokes = [
      "Star Wars sequel trilogy does not exist. It’s just a bad dream.",
      "Some say Luke Skywalker died in The Last Jedi. Others say the writers did.",
      "The Rise of Skywalker was so bad, even Jar Jar walked out.",
      "How does Darth Vader like his eggs? On the dark side.",
      "Order 66: when Ctrl+C and Ctrl+V go too far.",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }, []);

  return (
    <Flex direction="column" minH="100vh" bg="gray.800" color="white">
      <Box bg="purple.400" px={4} py={1}>
        <Text fontWeight="bold" fontSize={"2xl"}>
          Pegasus WebHID
        </Text>
      </Box>

      <Flex flex="1">
        {!currentDeviceId ? (
          <Flex flex={1} justifyContent={"center"} alignItems={"center"}>
            <Button rounded="full" onClick={handleConnect}>
              Connect Device
            </Button>
          </Flex>
        ) : !device ? (
          <Flex flex={1} justifyContent={"center"} alignItems={"center"}>
            <Button rounded="full" onClick={requestDevice}>
              Reconnect Device
            </Button>
          </Flex>
        ) : (
          <>
            <Sidebar
              activePanel={activePanel}
              onSelectPanel={setActivePanel}
              panels={availablePanels}
              battery={battery ?? 0}
              device={device}
            />

            <Box flex="1" p={8} position="relative">
              {activePanel === "performance" && (
                <PerformancePanel device={device} />
              )}
              {activePanel === "dpi" && <DPIProfilePanel device={device} />}
              {activePanel === "rgb" && <RGBPanel device={device} />}
              {activePanel === "keymapping" && <KeymapPanel device={device} />}
            </Box>
          </>
        )}
      </Flex>

      <Box bg="purple.400" px={4} py={1}>
        <Text>{joke}</Text>
      </Box>
    </Flex>
  );
}

export default App;
