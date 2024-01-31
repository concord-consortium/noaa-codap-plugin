import { createContext, useContext, useEffect } from "react";
import { Updater, useImmer } from "use-immer";
import { IState, DefaultState } from "../types";
import { codapInterface } from "@concord-consortium/codap-plugin-api";

export interface IStateContext {
  state: IState;
  setState: Updater<IState>;
}

export const useStateContextInAppContainerOnly = (): IStateContext => {
  const [state, setState] = useImmer<IState>(DefaultState);

  useEffect(() => {
    codapInterface.updateInteractiveState(state);
  }, [state]);


  return {
    state,
    setState
  };
};

// note: the "setState: () => undefined" is fine as it is overridden in the AppContainer.Provider tag
export const StateContext = createContext<IStateContext>({state: DefaultState, setState: () => undefined});
export const useStateContext = () => useContext(StateContext);
