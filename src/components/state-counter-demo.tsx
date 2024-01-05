import React from "react";
import { useStateContext } from "../hooks/use-state";

export const StateCounterDemoToBeRemoved = () => {
  const {state, setState} = useStateContext();
  const {counterToTestStateChanges} = state;

  const handleClick = () => setState(draft => {
    draft.counterToTestStateChanges++;
  });

  return (
    <div onClick={handleClick} style={{padding: 20, backgroundColor: "green", color: "white"}}>
      <div>
        <strong>State Counter Demo (to be removed)</strong>
      </div>
      Click here to increase the counter stored in the state: {counterToTestStateChanges}
    </div>
  );
};
