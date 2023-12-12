import React, {
  type FC,
  type PropsWithChildren,
  createContext,
  memo,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  TreeSelectionModal,
  type TreeSelectionModalIns,
} from "@components/admin";
import {
  Drawer,
  Flex,
  Box,
  Radio,
  Space,
  RadioGroup,
} from "@styled-antd/react";
import { createArea, type UsersTreeRes, getUsersTree } from "apis";

// 因为create和update的payload都是一样的，所以这里以create的模型为准

type ContextType = {
  approveIntent: (
    treeData: UsersTreeRes[],
    originSelectedData: [],
    approveType: string,
    callback?: () => void
  ) => void;

  userIntent: (
    treeData: UsersTreeRes[],
    originSelectedData: [],
    callback?: () => void
  ) => void;
};

export const ApproveActionsContext = createContext<ContextType | undefined>(
  undefined
);

export const ApproveActionsProvider: FC<PropsWithChildren> = memo(
  ({ children }) => {
    const [open, setOpen] = useState(false);

    const actionRef = useRef<TreeSelectionModalIns>(null);

    const [title, setTitle] = useState("审批人设置");
    const [userTreeData, setUserTreeData] = useState<UsersTreeRes[]>([]);

    const successCallback = useRef<() => void>();

    const [model, setModel] = useState("approve");
    /**
     * 审批方式 0-会签（需要所有审批人都同意才可通过）1-或签（其中一名审批人同意或拒绝即可）
     */
    const [approveType, setApproveType] = useState("0");
    const [originSelectedData, setOriginSelectedData] = useState([]);

    // 加工区域树
    const createTreeData = useCallback((data: UsersTreeRes[]) => {
      const arr: UsersTreeRes[] = [];
      if (!data || data.length === 0) return [];

      data.forEach((ele: UsersTreeRes) => {
        const obj = {
          ...ele,
          key: ele.id,
          title: ele.name,
          children: ele.children ? createTreeData(ele.children) : ele.children,
        };
        arr.push(obj);
      });
      return arr;
    }, []);

    const getTreeDataHandler = useCallback(async () => {
      const res = await getUsersTree().request();
      setUserTreeData(createTreeData([res]));
    }, [createTreeData]);

    useEffect(() => {
      if (open) {
        getTreeDataHandler();
      }

      return () => {};
    }, [open, getTreeDataHandler]);

    const approveIntent = useCallback<ContextType["approveIntent"]>(
      (tree, payload, type, callback) => {
        setUserTreeData(tree);
        setOriginSelectedData(payload);
        setTitle("审批人设置");
        setApproveType(type);
        setModel("approve");
        successCallback.current = callback;
        setOpen(true);
      },
      []
    );

    const userIntent = useCallback<ContextType["userIntent"]>(
      (tree, payload, callback) => {
        setUserTreeData(tree);
        setOriginSelectedData(payload);
        setTitle("添加用户");
        setModel("user");
        successCallback.current = callback;
        setOpen(true);
      },
      []
    );

    const handleFinish = useCallback(async () => {
      const data = {};
      const selectData = actionRef?.current?.selectOk();

      console.log(res);
      // setOpen(false);
      // successCallback.current?.();
    }, []);

    const handleAfterOpenChange = useCallback((bool: boolean) => {
      if (!bool) {
        setTitle("审批人设置");
        setModel("approve");
        setApproveType("0");
        setOpen(false);
      }
    }, []);

    const contextValue = useMemo<ContextType>(
      () => ({
        approveIntent,
        userIntent,
      }),
      [approveIntent, userIntent]
    );

    return (
      <ApproveActionsContext.Provider value={contextValue}>
        {children}
        <Drawer
          open={open}
          title={title}
          width={960}
          onOk={handleFinish}
          onClose={() => setOpen(false)}
          afterOpenChange={handleAfterOpenChange}
        >
          {model === "approve" ? (
            <Flex flexDir="column" gap={8}>
              <Box>请选择该节点的审批人</Box>
              <Box maxH={400} overflow="auto">
                <TreeSelectionModal
                  treeData={userTreeData}
                  actionRef={actionRef}
                  // selectData={[]}
                />
              </Box>
              <Box>多人审批时采用的审批方式</Box>
              <RadioGroup
                value={approveType}
                onChange={(e) => setApproveType(e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="0">会签（需要所有审批人都同意才可通过）</Radio>
                  <Radio value="1">或签（其中一名审批人同意或拒绝即可）</Radio>
                </Space>
              </RadioGroup>
            </Flex>
          ) : (
            <Flex maxH={400} overflow="auto">
              <TreeSelectionModal
                treeData={userTreeData}
                actionRef={actionRef}
                selectData={originSelectedData}
              />
            </Flex>
          )}
        </Drawer>
      </ApproveActionsContext.Provider>
    );
  }
);
