# 🌲 Mutare Sewer Asset Management System

[![Node.js Version](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.9+-blue)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-orange)](https://postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.x-darkgreen)](https://postgis.net/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/nabelis-jasi/mutare-backend/pulls)

> **A professional, QGIS‑like sewer asset management dashboard for Mutare City Council.**  
> Combines mapping, real‑time job tracking, advanced analytics, and mobile app integration.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Mobile App Integration](#mobile-app-integration)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Frontend Components](#frontend-components)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🎯 Overview

The **Mutare Sewer Asset Management System** is a complete, enterprise‑grade solution for managing sewer infrastructure, field operations, and maintenance activities for Mutare City Council.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Interactive Mapping** | Leaflet-based map with multiple base layers (Street, Satellite, Hybrid, Topographic) |
| **Asset Management** | Full CRUD operations on manholes, pipelines, pump stations, and suburb boundaries |
| **Real‑time Job Tracking** | Live updates for field operators via WebSocket |
| **Advanced Analytics** | Predictive risk scoring, hotspot detection, operator performance metrics |
| **Offline Support** | Field teams can log jobs offline and sync when connected |
| **Reporting** | Automated PDF reports, CSV/JSON export, print layouts |
| **Mobile Integration** | Dedicated APIs for field operator and collector mobile apps |

### Target Users

| User Type | Role | Access |
|-----------|------|--------|
| **Engineers** | Planning, analysis, reporting | Full dashboard access |
| **Field Operators** | Unblocking, repairs, inspections | Mobile app + limited dashboard |
| **Field Collectors** | Data collection, photos, condition reports | Mobile app only |
| **Administrators** | User management, system configuration | Full dashboard + admin panel |

---

## ✨ Features

### 🗺️ QGIS‑Like Mapping

| Feature | Description |
|---------|-------------|
| **Layer Management** | Add/remove PostGIS layers (points, lines, polygons) |
| **Base Maps** | Street, Satellite, Hybrid, Topographic (4 styles) |
| **Custom Markers** | Color‑coded by status (Critical, Warning, Good) |
| **Heatmaps** | Visualize blockage hotspots and density |
| **GeoJSON Export** | Download any layer as GeoJSON |
| **Layer Styling** | Customize colors, opacity, line weights |
| **Zoom to Layer** | Automatically fit map to layer extent |
| **Project Save/Load** | Save layer configurations and reload later |

### 📊 Tableau‑Style Analytics

| Feature | Description |
|---------|-------------|
| **Blockage Trends** | Bar charts showing blockages by suburb |
| **Operator Performance** | Leaderboard, response times, completion rates |
| **Predictive Risk Scoring** | ML‑based risk prediction for each asset |
| **Seasonal Patterns** | Monthly and weekly blockage trends |
| **Hotspot Analysis** | Identify high‑problem areas |
| **Custom Date Ranges** | Filter analytics by any date range |
| **Export Charts** | Download charts as PNG/PDF |

### 📱 Mobile Integration

| Feature | Description |
|---------|-------------|
| **Real‑time Job Assignment** | Push jobs to specific operators |
| **GPS Tracking** | Live operator location on dashboard map |
| **Photo Upload** | Capture and upload inspection photos |
| **Video Recording** | Record and upload inspection videos |
| **Offline Mode** | Log jobs without internet, auto‑sync when online |
| **Push Notifications** | Alert operators of urgent jobs |
| **Job History** | View complete job history per asset |

### 📄 Reporting

| Feature | Description |
|---------|-------------|
| **Weekly Summary PDF** | Automatic weekly report with council branding |
| **Monthly Performance** | Operator and asset performance metrics |
| **Asset History Report** | Complete maintenance history per asset |
| **CSV Export** | Export any data table to CSV |
| **JSON Export** | API‑ready JSON data export |
| **Print Layout** | Print‑ready map layouts |
| **Automated Reports** | Scheduled daily/weekly email reports |

### 🔍 Smart Filtering

| Feature | Description |
|---------|-------------|
| **Click‑Only Interface** | No SQL required – just click filters |
| **Filter by Suburb** | Show assets in specific suburbs |
| **Filter by Diameter** | Small (<100mm), Medium (100-150mm), Large (>150mm) |
| **Filter by Material** | Concrete, PVC, Asbestos, Clay, Cast Iron |
| **Filter by Status** | Critical, Warning, Good |
| **Active Filters Display** | See currently applied filters |
| **Clear All** | One‑click reset all filters |
| **Accordion Style** | Collapsible filter sections for clean UI |

---

## 🏗️ Architecture

### System Architecture Diagram
