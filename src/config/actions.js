// src/store/actionTypes.js

// ====================
// Auth & User
// ====================
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGOUT = 'LOGOUT';
export const SET_USER = 'SET_USER';
export const UPDATE_USER_PROFILE = 'UPDATE_USER_PROFILE';

// ====================
// Spatial Data (Manholes, Pipelines)
// ====================
export const FETCH_MANHOLES = 'FETCH_MANHOLES';
export const FETCH_PIPELINES = 'FETCH_PIPELINES';
export const FETCH_SUBURBS = 'FETCH_SUBURBS';
export const UPDATE_MANHOLE = 'UPDATE_MANHOLE';
export const UPDATE_PIPELINE = 'UPDATE_PIPELINE';
export const DELETE_MANHOLE = 'DELETE_MANHOLE';
export const DELETE_PIPELINE = 'DELETE_PIPELINE';
export const SET_ACTIVE_CONNECTION = 'SET_ACTIVE_CONNECTION';
export const CLEAR_SPATIAL_DATA = 'CLEAR_SPATIAL_DATA';

// ====================
// Connections (Engineer)
// ====================
export const FETCH_CONNECTIONS = 'FETCH_CONNECTIONS';
export const CREATE_CONNECTION = 'CREATE_CONNECTION';
export const UPDATE_CONNECTION = 'UPDATE_CONNECTION';
export const DELETE_CONNECTION = 'DELETE_CONNECTION';
export const ACTIVATE_CONNECTION = 'ACTIVATE_CONNECTION';
export const TEST_CONNECTION = 'TEST_CONNECTION';

// ====================
// Maintenance Records (Operator → Engineer)
// ====================
export const FETCH_MAINTENANCE_RECORDS = 'FETCH_MAINTENANCE_RECORDS';
export const CREATE_MAINTENANCE_RECORD = 'CREATE_MAINTENANCE_RECORD';
export const APPROVE_MAINTENANCE_RECORD = 'APPROVE_MAINTENANCE_RECORD';
export const REJECT_MAINTENANCE_RECORD = 'REJECT_MAINTENANCE_RECORD';
export const FILTER_MAINTENANCE_RECORDS = 'FILTER_MAINTENANCE_RECORDS';

// ====================
// Asset Edits (Operator → Engineer)
// ====================
export const FETCH_ASSET_EDITS = 'FETCH_ASSET_EDITS';
export const CREATE_ASSET_EDIT = 'CREATE_ASSET_EDIT';
export const APPROVE_ASSET_EDIT = 'APPROVE_ASSET_EDIT';
export const REJECT_ASSET_EDIT = 'REJECT_ASSET_EDIT';

// ====================
// Forms & Submissions (Engineer → Collector)
// ====================
export const FETCH_FORMS = 'FETCH_FORMS';
export const CREATE_FORM = 'CREATE_FORM';
export const UPDATE_FORM = 'UPDATE_FORM';
export const DELETE_FORM = 'DELETE_FORM';
export const FETCH_FORM_SCHEMA = 'FETCH_FORM_SCHEMA';
export const SAVE_FORM_SCHEMA = 'SAVE_FORM_SCHEMA';

export const FETCH_SUBMISSIONS = 'FETCH_SUBMISSIONS';
export const CREATE_SUBMISSION = 'CREATE_SUBMISSION';
export const UPDATE_SUBMISSION_STATUS = 'UPDATE_SUBMISSION_STATUS'; // approve/reject
export const DELETE_SUBMISSION = 'DELETE_SUBMISSION';
export const SYNC_OFFLINE_SUBMISSIONS = 'SYNC_OFFLINE_SUBMISSIONS';

// ====================
// Flags (Collector → Engineer)
// ====================
export const FETCH_FLAGS = 'FETCH_FLAGS';
export const CREATE_FLAG = 'CREATE_FLAG';
export const RESOLVE_FLAG = 'RESOLVE_FLAG';
export const DELETE_FLAG = 'DELETE_FLAG';

// ====================
// Analytics & Reports (Engineer)
// ====================
export const FETCH_ANALYTICS_COUNTS = 'FETCH_ANALYTICS_COUNTS';
export const FETCH_OPERATOR_ACTIVITY = 'FETCH_OPERATOR_ACTIVITY';
export const FETCH_MAINTENANCE_STATS = 'FETCH_MAINTENANCE_STATS';
export const FETCH_ASSET_EDITS_STATS = 'FETCH_ASSET_EDITS_STATS';
export const FETCH_RESOLUTION_TIME = 'FETCH_RESOLUTION_TIME';
export const FETCH_FLAG_HOTSPOTS = 'FETCH_FLAG_HOTSPOTS';
export const FETCH_JOB_LOGS = 'FETCH_JOB_LOGS';
export const FETCH_PERIODIC_REPORTS = 'FETCH_PERIODIC_REPORTS'; // daily/weekly/monthly

// ====================
// UI State
// ====================
export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB';
export const SET_LOADING = 'SET_LOADING';
export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const SHOW_TOAST = 'SHOW_TOAST';
export const HIDE_TOAST = 'HIDE_TOAST';
export const TOGGLE_MODAL = 'TOGGLE_MODAL';
export const SET_MAP_VIEW = 'SET_MAP_VIEW';
export const SET_SELECTED_FEATURE = 'SET_SELECTED_FEATURE';
export const SET_SELECTED_FORM = 'SET_SELECTED_FORM';

// ====================
// Offline & Sync
// ====================
export const QUEUE_OFFLINE_ACTION = 'QUEUE_OFFLINE_ACTION';
export const PROCESS_OFFLINE_QUEUE = 'PROCESS_OFFLINE_QUEUE';
export const SET_SYNC_STATUS = 'SET_SYNC_STATUS';
export const UPDATE_SYNC_PROGRESS = 'UPDATE_SYNC_PROGRESS';
export const CLEAR_PENDING_SUBMISSIONS = 'CLEAR_PENDING_SUBMISSIONS';

// ====================
// Bulk Operations (Shapefile Upload)
// ====================
export const UPLOAD_SHAPEFILE = 'UPLOAD_SHAPEFILE';
export const SET_UPLOAD_PROGRESS = 'SET_UPLOAD_PROGRESS';
export const UPLOAD_ERROR = 'UPLOAD_ERROR';
export const CLEAR_UPLOAD_STATE = 'CLEAR_UPLOAD_STATE';

// ====================
// GeoServer & Map Layers
// ====================
export const SET_GEOSERVER_URL = 'SET_GEOSERVER_URL';
export const TOGGLE_LAYER = 'TOGGLE_LAYER'; // manholes, pipelines, suburbs layers
export const SET_BASE_MAP = 'SET_BASE_MAP'; // street, satellite, hybrid
export const SET_MAP_ZOOM = 'SET_MAP_ZOOM';
export const SET_MAP_CENTER = 'SET_MAP_CENTER';
