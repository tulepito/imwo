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
} from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, PropsWithChildren, ReactNode, useMemo } from "react";

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
  "gray.100",
  "red.200",
  "green.200",
  "blue.200",
  "yellow.200",
  "purple.200",
  "pink.200",
  "orange.200",
  "cyan.200",
  "teal.200",
  "gray.200",
];

const useDishGroupsRenderData = () => {
  const router = useRouter();
  const dishGroupList = router.query["dish-group-list"] as String;
  const dishGroups = String(dishGroupList)
    .split("chunk")
    .filter((item) => !!item);

  const _mockDishGroups = [
    ...dishGroups,
    ...dishGroups,
    ...dishGroups,
    ...dishGroups,
    ...dishGroups,
  ];

  const dishGroupsRenderData = _mockDishGroups.reduce(
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

      _dishGroupsRenderData.push({ groupName, noOfChoose, dishes });
      return _dishGroupsRenderData;
    },
    [] as DishGroup[]
  );

  const isValid = useMemo(
    () =>
      dishGroupsRenderData.every(
        (dishGroup) =>
          !!dishGroup.groupName &&
          !!dishGroup.dishes.length &&
          dishGroup.noOfChoose >= 0
      ),
    [dishGroupsRenderData]
  );

  return {
    dishGroupsRenderData,
    isValid,
  };
};

export default function Home() {
  return (
    <main>
      <Head>
        <title>Convert image tool!</title>
      </Head>
      <Box bg="gray.100" p={4} w="100%" color="black" borderRadius="lg">
        <Stack spacing={8}>
          <HomeHeader />
          <CateringMenuSetion />
        </Stack>
      </Box>
    </main>
  );
}

const MAX_COLUMNS = 8;
interface DishGroup {
  groupName: string;
  noOfChoose: number;
  dishes: string[];
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
    >
      {props.children}
    </Box>
  );
}

function CateringMenuSetion() {
  const { dishGroupsRenderData, isValid } = useDishGroupsRenderData();

  return (
    <CateringMenuCard>
      {isValid && (
        <>
          <PITOCateringLogo />
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
              .map((dishGroup: DishGroup, idx) => (
                <Fragment key={idx}>
                  <Column>
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
              ))}
          </Stack>
        </>
      )}

      {!isValid && (
        <Stack>
          <Text fontSize="2xl" fontWeight="bold" color="red">
            Menu không đúng cấu trúc
          </Text>
          <Text fontSize="md" color="gray.500">
            Vui lòng kiểm tra lại dữ liệu từ phía ứng dụng
          </Text>
          <List>
            <ListItem>
              Kiểm tra dữ liệu cột <Kbd>Thực đơn</Kbd> có phải là tên một menu
              hay chưa?
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
      )}
    </CateringMenuCard>
  );
}

function PITOCateringLogo() {
  return (
    <Box position="absolute" top={3} left={0}>
      <Sprite
        imageUrl="/sample-menu.png"
        x={0}
        y={0}
        w={120}
        h={80}
        scale={10}
      />
    </Box>
  );
}

function CateringMenuHeader() {
  const router = useRouter();
  const { type } = router.query;

  return (
    <Stack spacing={4} pb={8} color="red.500">
      <Text fontSize="3xl" fontWeight="bold" align="center">
        Menu: {type}
      </Text>
    </Stack>
  );
}

function DishList(props: PropsWithChildren<{}>) {
  return (
    <Stack spacing={2} alignItems="stretch">
      {props.children}
    </Stack>
  );
}

function DishListItem(props: PropsWithChildren<{}>) {
  return (
    <Box bg="gray.50" px={4} py={2} w="auto" borderRadius="16px">
      -&nbsp;&nbsp;&nbsp;
      <Text as="span" fontWeight="semibold">
        {props.children}
      </Text>
    </Box>
  );
}

function Column(props: PropsWithChildren<{}>) {
  return (
    <Stack spacing={4} flex={1} maxW="280px" minW={"280px"}>
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
      <Box
        bg={randomColor}
        px={8}
        py={2}
        w="100%"
        borderRadius="16px"
        boxShadow="sm"
      >
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
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
