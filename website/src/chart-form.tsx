import { type FC } from "react";

export const ChartForm: FC = () => {
  return (
    <form action="/" method="GET">
      <label>
        Auth Secret
        <input type="text" name="auth" />
      </label>
      <label>
        Database ID:
        <input type="text" name="databaseId" />
      </label>
      <label>
        Label:
        <input type="text" name="label" />
      </label>
      <label>
        Value:
        <input type="text" name="value" />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
};
