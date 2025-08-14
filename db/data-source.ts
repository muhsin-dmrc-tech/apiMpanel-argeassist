import { DataSource } from "typeorm";
import { getConfig } from "./data-source.config";

const datasource = new DataSource(getConfig());

datasource.initialize();

export default datasource;