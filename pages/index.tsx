import {
  Avatar,
  Kbd,
  Text,
  Stack,
  Box,
  StackDivider,
  List,
  ListItem,
  Code,
  Container,
  Button,
  Spinner,
} from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Fragment,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toPng } from "html-to-image";
import { useToast } from "@chakra-ui/react";

const CATERING_MENU_CARD_ID = "catering-menu-card";
const CATERING_MENU_IMAGE_ID = "catering-menu-image";

const MAX_ROW_INSIDE_COLUMN = 10;
const MAX_COLUMNS = 10;

const colors = [
  "red.100",
  "green.100",
  "blue.100",
  "yellow.100",
  "purple.100",
  "pink.100",
  "orange.100",
  "cyan.100",
  "teal.100",
  "red.200",
  "green.200",
  "blue.200",
  "yellow.200",
  "purple.200",
  "pink.200",
  "orange.200",
  "cyan.200",
  "teal.200",
];

function dataUrlToBlob(dataUrl: string) {
  const arr = dataUrl.split(","),
    mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

const useDishGroupsRenderData = () => {
  const router = useRouter();
  const { type } = router.query;

  const dishGroupList = router.query["dish-group-list"] as String | undefined;
  const dishGroups = (dishGroupList || "")
    .split("chunk")
    .filter((item) => !!item);

  const precalculatedRowDishGroupsRenderData = dishGroups.reduce(
    (_dishGroupsRenderData, currentString) => {
      const indexOfFirstDash = currentString.indexOf("-");
      const groupNameString = currentString.substring(0, indexOfFirstDash);
      const noOfChooseAndDishesString = currentString.substring(
        indexOfFirstDash + 1,
        currentString.length
      );

      const groupName = groupNameString.trim();

      const indexOfFirstColon = noOfChooseAndDishesString.indexOf("(");
      const noOfChooseString = noOfChooseAndDishesString.substring(
        0,
        indexOfFirstColon
      );

      const dishesSrting = noOfChooseAndDishesString.substring(
        indexOfFirstColon + 1,
        noOfChooseAndDishesString.length
      );
      const noOfChoose = Number(noOfChooseString.toString().match(/\d+/));

      const dishes = dishesSrting
        .replace("(", "")
        .replace(")", "")
        .split(";")
        .map((dish) => dish.trim());

      let noOfColumnsInsideColumn = 1;
      if (dishes.length > MAX_ROW_INSIDE_COLUMN) {
        noOfColumnsInsideColumn = Math.ceil(
          dishes.length / MAX_ROW_INSIDE_COLUMN
        );
      }

      _dishGroupsRenderData.push({
        groupName,
        noOfChoose,
        dishes,
        noOfColumnsInsideColumn,
      });
      return _dishGroupsRenderData;
    },
    [] as DishGroup[]
  );

  const dishGroupsRenderData: DishGroup[] = useMemo(() => {
    const totalNoOfColumns = precalculatedRowDishGroupsRenderData.reduce(
      (totalNoOfColumns, dishGroup) => {
        return totalNoOfColumns + dishGroup.noOfColumnsInsideColumn;
      },
      0
    );
    const noFixedColumns = precalculatedRowDishGroupsRenderData.length;
    const noGreaterThan1Columns = precalculatedRowDishGroupsRenderData.filter(
      (dishGroup) => dishGroup.noOfColumnsInsideColumn > 1
    ).length;
    const remainingColumns =
      noGreaterThan1Columns + (MAX_COLUMNS - noFixedColumns);

    if (totalNoOfColumns <= MAX_COLUMNS) {
      return precalculatedRowDishGroupsRenderData;
    }

    return precalculatedRowDishGroupsRenderData.map((dishGroup) => {
      let noOfColumns;

      if (dishGroup.dishes.length <= MAX_ROW_INSIDE_COLUMN) {
        noOfColumns = 1;
      } else {
        const percentage =
          (dishGroup.noOfColumnsInsideColumn / totalNoOfColumns) * 100;
        noOfColumns = Math.floor((percentage / 100) * remainingColumns);

        // make sure noOfColumns is at least 1
        if (noOfColumns < 1) {
          noOfColumns = 1;
        }
      }

      return {
        ...dishGroup,
        noOfColumnsInsideColumn: noOfColumns,
      };
    });
  }, [precalculatedRowDishGroupsRenderData]);

  const isValid = useMemo(() => {
    return (
      !!dishGroupsRenderData.length &&
      dishGroupsRenderData.every(
        (dishGroup) =>
          !!dishGroup.groupName &&
          !!dishGroup.dishes.length &&
          dishGroup.noOfChoose >= 0 &&
          !!type
      )
    );
  }, [dishGroupsRenderData, type]);

  return {
    dishGroupsRenderData,
    isValid,
  };
};

export default function Home() {
  const { dishGroupsRenderData, isValid } = useDishGroupsRenderData();

  return (
    <main>
      <Head>
        <title>Convert image tool!</title>
      </Head>
      <Container maxW={"container.xl"}>
        <Box bg="gray.100" p={4} w="100%" color="black" borderRadius="lg">
          <Stack spacing={8}>
            <HomeHeader />
            {!!dishGroupsRenderData.length && (
              <>
                {isValid ? (
                  <>
                    <CateringMenuSetion
                      dishGroupsRenderData={dishGroupsRenderData}
                    />
                    <CateringMenuImageSection
                      dishGroupsRenderData={dishGroupsRenderData}
                      isValid={isValid}
                    />
                  </>
                ) : (
                  <CateringMenuSectionError />
                )}
              </>
            )}

            {!dishGroupsRenderData.length && <CateringMenuEmptySection />}
          </Stack>
        </Box>
      </Container>
    </main>
  );
}

function CateringMenuImageSection({
  dishGroupsRenderData,
  isValid,
}: {
  dishGroupsRenderData: DishGroup[];
  isValid: boolean;
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [processing, setProcessing] = useState(true);
  const toast = useToast();

  useEffect(() => {
    console.log("RENDER...");
    toPng(document.getElementById(CATERING_MENU_CARD_ID) as HTMLElement, {
      cacheBust: true,
    }).then(function (dataUrl) {
      if (isValid) {
        setDataUrl(dataUrl);
        onAutomaticallyCopy();
      }
      setProcessing(false);
    });
  }, [dishGroupsRenderData, isValid]);

  function onAutomaticallyCopy() {
    setTimeout(() => {
      onCopy();
    }, 1000);
  }

  function toastSuccess() {
    toast({
      title: "Copy thành công!",
      description:
        "Hình ảnh đã được copy vào clipboard, Ctrl + V để dán vào ứng dụng khác",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }

  const onCopy = () => {
    if (!isValid) return;

    const imageElement = document.getElementById(
      CATERING_MENU_IMAGE_ID
    ) as HTMLImageElement;
    const blob = dataUrlToBlob(imageElement.src);
    const item = new ClipboardItem({ "image/png": blob });
    navigator.clipboard.write([item]);

    toastSuccess();
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = dataUrl;
    link.click();
  };

  if (processing) {
    return (
      <Stack>
        <Text fontSize="2xl" fontWeight="bold">
          Đang xử lý...
        </Text>
        <Text fontSize="md" color="gray.500">
          Vui lòng đợi trong giây lát
        </Text>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Stack>
    );
  }

  return (
    <Stack>
      {isValid && (
        <Stack direction="row" justifyContent="center">
          <Button colorScheme="blue" onClick={downloadImage}>
            Tải ảnh về
          </Button>
          <Button colorScheme="green" onClick={onCopy}>
            Copy vào clipboard
          </Button>
        </Stack>
      )}
      {isValid && dataUrl && (
        <img
          src={dataUrl}
          style={{
            objectFit: "contain",
            maxHeight: dishGroupsRenderData.length * 300,
          }}
          id={CATERING_MENU_IMAGE_ID}
        />
      )}
    </Stack>
  );
}

interface DishGroup {
  groupName: string;
  noOfChoose: number;
  dishes: string[];
  noOfColumnsInsideColumn: number;
}

function CateringMenuCard(props: PropsWithChildren<{}>) {
  return (
    <Box
      bg="white"
      w="100%"
      p={8}
      borderRadius="lg"
      boxShadow="lg"
      position="relative"
      overflow="hidden"
      id={CATERING_MENU_CARD_ID}
      minW={"600px"}
    >
      {props.children}
    </Box>
  );
}

function AbsoluteHiddenBox(props: PropsWithChildren<{}>) {
  return (
    <Box position="absolute" top={-9999} left={-9999}>
      {props.children}
    </Box>
  );
}

function CateringMenuSectionError() {
  return (
    <Box
      bg="white"
      w="100%"
      p={8}
      borderRadius="lg"
      boxShadow="lg"
      position="relative"
      overflow="hidden"
      id={CATERING_MENU_CARD_ID}
    >
      <Stack>
        <Text fontSize="2xl" fontWeight="bold" color="red">
          Menu không đúng cấu trúc
        </Text>
        <Text fontSize="md" color="gray.500">
          Vui lòng kiểm tra lại dữ liệu từ phía ứng dụng
        </Text>
        <List>
          <ListItem>
            Kiểm tra dữ liệu cột <Kbd>Thực đơn</Kbd> có phải là tên một menu hay
            chưa?
          </ListItem>
          <ListItem>
            Kiểm tra dữ liệu cột <Kbd>Danh sách món ăn</Kbd>, <Kbd>mon2</Kbd>,{" "}
            <Kbd>mon3</Kbd>, <Kbd>mon4</Kbd>, <Kbd>mon5</Kbd> có đúng cấu trúc
            giống ví dụ sau hay chưa:
            <br />
            <Box my={2}>
              <Code>
                Bánh Ngọt - Chọn: 4 món (Bánh su kem ; Bánh tiramisu ; Bánh
                croissant ; Panna cotta ; Mousse tiramisu ; Chocolate danish)
              </Code>
            </Box>
          </ListItem>
        </List>
      </Stack>
    </Box>
  );
}

function CateringMenuEmptySection() {
  return (
    <Box
      bg="white"
      w="100%"
      p={8}
      borderRadius="lg"
      boxShadow="lg"
      position="relative"
      overflow="hidden"
      id={CATERING_MENU_CARD_ID}
    >
      <Stack>
        <Text fontSize="md" color="gray.500">
          Không tìm thấy dữ liệu từ ứng dụng
        </Text>
      </Stack>
    </Box>
  );
}

function CateringMenuSetion({
  dishGroupsRenderData,
}: {
  dishGroupsRenderData: DishGroup[];
}) {
  return (
    <AbsoluteHiddenBox>
      <CateringMenuCard>
        <Box>
          <CateringMenuHeader />
          <Stack
            direction="row"
            spacing={4}
            divider={<StackDivider />}
            alignItems="flex-start"
            justifyContent="center"
          >
            {dishGroupsRenderData
              .slice(0, MAX_COLUMNS)
              .map((dishGroup: DishGroup, idx) => {
                const width =
                  dishGroup.noOfColumnsInsideColumn * 280 +
                  (dishGroup.noOfColumnsInsideColumn - 1) * 10;

                return (
                  <Fragment key={idx}>
                    <Column width={`${width}px`}>
                      <ColumnHeader
                        primaryText={dishGroup.groupName}
                        secondaryText={
                          <>
                            Chọn{" "}
                            <Text
                              fontWeight="bold"
                              color="black"
                              as="span"
                              fontSize="20px"
                            >
                              {dishGroup.noOfChoose}
                            </Text>{" "}
                            món
                          </>
                        }
                      />
                      <ColumnContent>
                        <DishList>
                          {dishGroup.dishes.map((dish) => (
                            <DishListItem key={dish}>{dish}</DishListItem>
                          ))}
                        </DishList>
                      </ColumnContent>
                    </Column>
                  </Fragment>
                );
              })}
          </Stack>
        </Box>
      </CateringMenuCard>
    </AbsoluteHiddenBox>
  );
}

function PITOCateringLogo() {
  return (
    <Box minW="300px">
      <Sprite
        imageUrl="/sample-menu.png"
        x={24}
        y={20}
        w={120}
        h={60}
        scale={12}
      />
    </Box>
  );
}

function PITOCateringMenuInfoRightSection() {
  const { price, "no-of-people": noOfPeople } = useRouter().query;

  return (
    <Box minW="300px">
      <Text fontSize="lg" color="red.500" textAlign="right">
        Đơn giá: <b>{price}/người</b>
      </Text>
      <Text fontSize="lg" color="red.500" textAlign="right">
        Nhận đặt từ: <b>{noOfPeople} người</b>
      </Text>
    </Box>
  );
}

function CateringMenuHeader() {
  const router = useRouter();
  const { type } = router.query;

  return (
    <Stack
      direction="row"
      pb={8}
      alignItems="center"
      justifyContent="space-between"
      spacing={8}
    >
      <PITOCateringLogo />
      <Text fontSize="3xl" color="red.500" fontWeight="bold" align="center">
        Menu: {type}
      </Text>
      <PITOCateringMenuInfoRightSection />
    </Stack>
  );
}

function DishList({ children }: PropsWithChildren<{}>) {
  return (
    <Stack
      spacing={2}
      flexDirection="row"
      flexWrap="wrap"
      justifyContent="stretch"
    >
      {children}
    </Stack>
  );
}

function DishListItem(props: PropsWithChildren<{}>) {
  return (
    <Box bg="gray.50" px={4} py={2} borderRadius="16px" flexBasis="280px">
      -&nbsp;&nbsp;&nbsp;
      <Text as="span" fontWeight="semibold">
        {props.children}
      </Text>
    </Box>
  );
}

function Column(props: PropsWithChildren<{ width: string }>) {
  return (
    <Stack w={props.width} minW={"280px"} flexShrink={0} spacing={4}>
      {props.children}
    </Stack>
  );
}

function ColumnHeader({
  primaryText,
  secondaryText,
}: PropsWithChildren<{
  primaryText?: string;
  secondaryText?: string | ReactNode;
}>) {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return (
    <Stack spacing={4}>
      <Box bg={randomColor} px={2} py={2} borderRadius="16px" boxShadow="sm">
        <Text
          noOfLines={2}
          fontSize="lg"
          height={"54px"}
          fontWeight="bold"
          textAlign="center"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {primaryText}
        </Text>
      </Box>
      <Text fontSize="md" color="gray.500" textAlign="center">
        {secondaryText}
      </Text>
    </Stack>
  );
}

function ColumnContent(props: PropsWithChildren<{}>) {
  return <Stack spacing={2}>{props.children}</Stack>;
}

function HomeHeader() {
  return (
    <Stack spacing={1}>
      <Avatar src="/icon.png"></Avatar>
      <Text fontSize="2xl" fontWeight="bold">
        Convert your&nbsp;<Kbd>Menu</Kbd>&nbsp;into an&nbsp;
        <Kbd>Awesome image</Kbd>&nbsp;
      </Text>
    </Stack>
  );
}

const Sprite: React.FC<{
  imageUrl: string;
  w: number;
  h: number;
  x: number;
  y: number;
  scale?: number;
}> = ({ imageUrl, x, y, w, h, scale = 1 }) => {
  return (
    <div
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: `-${x}px -${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${scale * 100}%`,
      }}
    />
  );
};
