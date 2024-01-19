// */
// import {dataTypeStore} from "./noaaDataTypes.js";

// const noaaNCEIConnect = {

//     state: null,

//     constants: null,

//     beforeFetchHandler: null,
//     fetchSuccessHandler: null,
//     fetchErrorHandler: null,

//     initialize (state, constants, handlers) {
//         this.state = state;
//         this.constants = constants;
//         this.beforeFetchHandler = handlers.beforeFetchHandler;
//         this.fetchSuccessHandler = handlers.fetchSuccessHandler;
//         this.fetchErrorHandler = handlers.fetchErrorHandler;
//     },

//     composeURL() {
//         const format = "YYYY-MM-DDThh:mm:ss";

//         // noinspection JSPotentiallyInvalidConstructorUsage
//         let startDate = this.state.startDate;
//         let endDate = this.state.endDate;
//         // adjust for local station time
//         if (this.state.database === "global-hourly") {
//             let offset = this.state.stationTimezoneOffset;
//             startDate = dayjs(startDate).subtract(offset, "hour");
//             endDate = dayjs(endDate).subtract(offset, "hour").add(1, "day");
//         }
//         const startDateString = dayjs(startDate).format(
//             format);
//         // noinspection JSPotentiallyInvalidConstructorUsage
//         const endDateString = dayjs(endDate).format(
//             format);
//         if (new Date(startDateString) <= new Date(endDateString)) {
//             // const typeNames = this.getSelectedDataTypes().map(function (dataType) {
//             //     return dataType.name;
//             // })
//             const tDatasetIDClause = `dataset=${this.state.database}`;
//             const tStationIDClause = `stations=${this.getSelectedStations().join()}`;
//             const dataTypes = this.state.selectedDataTypes.filter(
//                 function (dt) {
//                     return dt !== "all-datatypes";
//                 }).map(function (name) {
//                     return dataTypeStore.findByName(name).sourceName;
//                 });
//             const tDataTypeIDClause = `dataTypes=${dataTypes.join()}`;
//             const tStartDateClause = `startDate=${startDateString}`;
//             const tEndDateClause = `endDate=${endDateString}`;
//             const tUnitClause = `units=metric`;
//             const tFormatClause = "format=json";

//             let tURL = [this.constants.nceiBaseURL, [tDatasetIDClause, tStationIDClause, tStartDateClause, tEndDateClause, tFormatClause, tDataTypeIDClause, tUnitClause].join(
//                 "&")].join("?");
//             console.log(`Fetching: ${tURL}`);
//             return tURL;
//         }
//     },

//     getSelectedStations () {
//         let id = this.state.database === "global-hourly"? "isdID": "ghcndID";
//         return [this.state.selectedStation && this.state.selectedStation[id]];
//     },

//     getSelectedDataTypes () {
//         return this.state.selectedDataTypes.filter(function (dt) {
//             return !!dataTypeStore.findByName(dt);
//         }).map(function (typeName) {
//             return dataTypeStore.findByName(typeName);
//         });
//     },

// };

// export {noaaNCEIConnect};
