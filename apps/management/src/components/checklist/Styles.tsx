export const Styles = () => (
  <style>
    {`.icsl-filter {
  margin-bottom: 20px;
}

.icsl-filter label {
  margin-right: 10px;
}

.icsl-filter-counts {
  margin-left: 10px;
  color: #3366cc;
}

.icsl-table {
  width: 100%;
}

.icsl-table tr:nth-child(even) {
  background-color: #efefef;
}

svg.MuiSvgIcon-fontSizeMedium {
  color: #3366cc;
}

.icsl-loader {
  position: relative;
}

.icsl-loader-outer {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  z-index: 1;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icsl-loader-inner {
  position: absolute;
  background-color: #efefef;
  padding: 20px;
  width: 100px;
  border-radius: 10px;
  height: 100%;
  opacity: 0.8;
}
.icsl-loader-graphic {
  color: #3366cc !important;
}
.icsl-tabs {
  margin-bottom: 20px;
}

.icsl-last-generated-date {
  float: right;
  color: #999999;
  font-size: 13px;
}
.icsl-last-generated-date span {
  font-weight: bold;
}

.icsl-tabs {
  list-style-type: none;
  margin: 0;
  padding: 0 0 30px;
}

.icsl-tabs button {
  all: unset;
}

.icsl-tabs li {
  display: inline-block;
  padding: 6px 20px;
  cursor: pointer;
}

.icsl-tabs li.icsl-tab-selected {
  border-bottom: 3px solid #3366cc;
}

.icsl-pill-taxon-change {
  border-radius: 3px;
  font-size: 12px;
  padding: 2px 8px;
}

.icsl-pill-taxon-merge {
  background-color: green;
  color: white;
}

.icsl-pill-taxon-split {
  background-color: #336699;
  color: white;
}

.icsl-pill-taxon-swap {
  background-color: #671967;
  color: white;
}

.icsl-taxon-changes-none {
  padding: 15px;
  color: #666666;
  background-color: #efefef;
  border: 1px solid #cccccc;
  border-radius: 6px;
}

.icsl-species-name {
  font-style: italic;
}

.icsl-inactive-taxon-change {
  text-decoration: line-through;
  color: #999999;
}

.icsl-inactive-taxon-change a {
  color: #999999;
}

.icsl-view-link:hover {
  svg {
    fill: orange;
  }
}

.icsl-year-filter {
  margin-bottom: 20px;
}

.icsl-year-filter label {
  margin-right: 8px;
}

.icsl-year-filter select {
  padding: 8px;
  background-color: white;
  border: 1px solid #cccccc;
  border-right: none;
  border-left: none;
}

.icsl-year-filter button {
  padding: 8px;
  background-color: white;
  border: 1px solid #cccccc;
}

.icsl-year-filter button:hover:not(:disabled) {
  background-color: #efefef;
  cursor: pointer;
}

.icsl-year-filter div {
  display: inline-flex;
}
    `}
  </style>
);
