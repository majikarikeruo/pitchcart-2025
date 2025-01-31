import { Box, Text, Paper, Badge, Image } from "@mantine/core";

export const SlideNode = ({ data, index }: { data: any; index: number }) => {
  const getHeatColor = (issues: number) => {
    if (issues === 0)
      return {
        bg: "var(--mantine-color-green-1)",
        border: "var(--mantine-color-green-2)",
      };
    if (issues <= 2)
      return {
        bg: "var(--mantine-color-yellow-1)",
        border: "var(--mantine-color-yellow-2)",
      };
    return {
      bg: "var(--mantine-color-red-1)",
      border: "var(--mantine-color-red-2)",
    };
  };

  const heatColor = getHeatColor(data.issues);

  return (
    <Paper
      w={200}
      radius="sm"
      style={{
        backgroundColor: heatColor.bg,
        borderColor: "#ededed",
        borderWidth: 2,
        borderStyle: "solid",
        cursor: "pointer",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
        },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Image
        src={`/assets/images/sample${String(index + 1).padStart(2, "0")}.jpg`}
      />
      <Box pos={"absolute"} top={0} left={0} w={"100%"} h={"100%"}>
        <Badge
          pos={"absolute"}
          left={8}
          bottom={8}
          size="md"
          circle
          style={{
            boxShadow: "0px 0px 4px rgba(0,0,0,0.1)",
            zIndex: "100",
          }}
        >
          {index + 1}
        </Badge>
        <Text
          fw={500}
          size={"xs"}
          lineClamp={2}
          p={4}
          bg={"#fff"}
          pos={"absolute"}
          top={"50%"}
          w={"100%"}
          ta={"center"}
        >
          {data.title}
        </Text>
        <Badge
          color={data.issues > 0 ? "red" : "green"}
          variant="light"
          pos={"absolute"}
          top={8}
          right={8}
        >
          改善点: {data.issues.length}
        </Badge>
      </Box>
    </Paper>
  );
};
