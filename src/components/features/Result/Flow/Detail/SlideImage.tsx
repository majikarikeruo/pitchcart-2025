import { Box, Image } from "@mantine/core";

/**
 * Todo:画像が変わった場合に拡張子含めた変数化を検討する
 */
export const SlideImage = ({ targetIndex }: { targetIndex: number }) => {
  const imageNumber = String(targetIndex + 1).padStart(2, "0");

  return (
    <Box bd={"solid 1px #eee"} mb={24}>
      <Image src={`/assets/images/sample${imageNumber}.jpg`} />
    </Box>
  );
};
