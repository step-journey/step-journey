import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { Menu } from "@mantine/core";
import {
  IconAlertCircle,
  IconAlertOctagon,
  IconAlertTriangle,
  IconCheck,
} from "@tabler/icons-react";
import "@/styles/alert-block.css";

// Alert 타입 정의
const alertTypes = [
  {
    title: "경고",
    value: "warning",
    icon: IconAlertTriangle,
    color: "#e69819",
    backgroundColor: {
      light: "#fff6e6",
      dark: "#805d20",
    },
  },
  {
    title: "오류",
    value: "error",
    icon: IconAlertOctagon,
    color: "#d80d0d",
    backgroundColor: {
      light: "#ffe6e6",
      dark: "#802020",
    },
  },
  {
    title: "정보",
    value: "info",
    icon: IconAlertCircle,
    color: "#507aff",
    backgroundColor: {
      light: "#e6ebff",
      dark: "#203380",
    },
  },
  {
    title: "성공",
    value: "success",
    icon: IconCheck,
    color: "#0bc10b",
    backgroundColor: {
      light: "#e6ffe6",
      dark: "#208020",
    },
  },
] as const;

// Alert 블록 스펙 정의
export const Alert = createReactBlockSpec(
  {
    type: "alert",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        default: "warning",
        values: ["warning", "error", "info", "success"],
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      const alertType = alertTypes.find(
        (a) => a.value === props.block.props.type,
      )!;
      const Icon = alertType.icon;

      return (
        <div className="alert" data-alert-type={props.block.props.type}>
          <Menu withinPortal={false}>
            <Menu.Target>
              <div className="alert-icon-wrapper" contentEditable={false}>
                <Icon
                  className="alert-icon"
                  data-alert-icon-type={props.block.props.type}
                  size={32}
                />
              </div>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>알림 타입</Menu.Label>
              <Menu.Divider />
              {alertTypes.map((type) => {
                const ItemIcon = type.icon;
                return (
                  <Menu.Item
                    key={type.value}
                    leftSection={
                      <ItemIcon
                        className="alert-icon"
                        data-alert-icon-type={type.value}
                        size={16}
                      />
                    }
                    onClick={() =>
                      props.editor.updateBlock(props.block, {
                        type: "alert",
                        props: { type: type.value },
                      })
                    }
                  >
                    {type.title}
                  </Menu.Item>
                );
              })}
            </Menu.Dropdown>
          </Menu>
          <div className="inline-content" ref={props.contentRef} />
        </div>
      );
    },
  },
);
