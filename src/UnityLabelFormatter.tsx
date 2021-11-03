import React from "react";

type Props = React.ComponentProps<"div"> & {
  content: string | undefined;
};

const UnityLabelFormatter = React.memo(
  ({ content, ...rest }: Props): React.ReactElement => {
    const html = renderToHtml(content ?? "");
    return <div {...rest} dangerouslySetInnerHTML={html} />;
  }
);

export default UnityLabelFormatter;

function renderToHtml(input: string): { __html: string } {
  const result = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n|\\n/g, "<br/>")
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g, "<strong>$1</strong>")
    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/g, "<em>$1</em>")
    .replace(
      /&lt;color=([^ >]+)&gt;(.*?)&lt;\/color&gt;/g,
      '<span style="color: $1">$2</span>'
    )
    .replace(
      /&lt;size=(\d+)&gt;(.*?)&lt;\/size&gt;/g,
      '<span style="font-size: $1px">$2</span>'
    )
    .replace(
      /https?:\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
      '<a href="$&">$&</a>'
    );
  return { __html: result };
}
