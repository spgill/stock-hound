// vendor imports
import axios from "axios";
import React from "react";
import ReactMarkdown from "react-markdown";

export function RemoteMarkdown(props) {
  const [content, setContent] = React.useState("_Loading..._");

  const fetchContent = React.useCallback(async (url) => {
    const response = await axios.get(url);
    setContent(response.data);
  }, []);
  React.useEffect(() => {
    fetchContent(props.url);
  }, [fetchContent, props.url]);

  return <ReactMarkdown>{content}</ReactMarkdown>;
}
