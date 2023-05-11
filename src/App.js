import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const useStyles = makeStyles((theme) => ({
  // CSS styles for different elements
  root: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  operationContainer: {
    marginTop: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operationItem: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    backgroundColor: '#eee',
    borderRadius: '4px',
    cursor: 'grab',
  },
}));

const App = () => {
  const classes = useStyles();
  const [csvData, setCsvData] = useState([]);
  const [transformedData, setTransformedData] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file) {
      // Read the dropped file as text
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvText = event.target.result;
        // Parse the CSV text and set the data state
        const parsedData = parseCSV(csvText);
        setCsvData(parsedData);
        setTransformedData(parsedData);
      };
      reader.readAsText(file);
    } else {
      console.error('No file was dropped.');
    }
  };

  const parseCSV = (csvText) => {
    // Parse the CSV text and return the data as an array of objects
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map((line) => {
      const values = line.split(',');
      // Create an object with headers as keys and corresponding values
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });
    return data;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const updatedData = Array.from(transformedData);
    const [removed] = updatedData.splice(source.index, 1);
    updatedData.splice(destination.index, 0, removed);
    setTransformedData(updatedData);
  };

  const handleOperationDragStart = (operation) => {
    setSelectedOperation(operation);
  };

  const handleOperationDragEnd = () => {
    setSelectedOperation(null);
  };

  const applyTransformation = (value, operation) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return value;

    switch (operation) {
      case 'addition':
        return (numericValue + 1).toString();
      case 'subtraction':
        return (numericValue - 1).toString();
      case 'multiplication':
        return (numericValue * 2).toString();
      default:
        return value;
    }
  }
  const handleOperationDrop = (operation, targetIndex) => {
    if (!operation || targetIndex === selectedRowIndex) return;

    const updatedData = transformedData.map((row, index) => {
      if (index === targetIndex) {
        const updatedRow = { ...row };
        Object.keys(updatedRow).forEach((key) => {
          const value = updatedRow[key];
          updatedRow[key] = applyTransformation(value, operation);
        });

        return updatedRow;
      }

      return row;
    });

    setTransformedData(updatedData);
  };

  return (
    <Container maxWidth="md" className={classes.root}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        ETL Tool
      </Typography>
      <Paper className={classes.paper}>
        <Typography variant="h6" component="h2" gutterBottom>
          CSV Data
        </Typography>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{ padding: '16px', border: '1px dashed #ccc' }}
        >
          {/* Check if a CSV file is uploaded */}
          {csvData.length === 0 ? (
            <Typography>No CSV file uploaded</Typography>
          ) : (
            <TableContainer className={classes.tableContainer}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(csvData[0]).map((header) => (
                      <TableCell key={header}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Render table rows */}
                  {csvData.map((row, index) => (
                    <TableRow key={index}>
                      {/* Render table cells */}
                      {Object.values(row).map((value, index) => (
                        <TableCell key={index}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </Paper>
         {/* Transformed Data */}
      <Paper className={classes.paper}>
        <Typography variant="h6" component="h2" gutterBottom>
          Transformed Data
        </Typography>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="transformedData">
            {(provided) => (
              <TableContainer
                className={classes.tableContainer}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(transformedData[0] || {}).map((header) => (
                        <TableCell key={header}>{header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transformedData.map((row, index) => (
                      <Draggable key={index} draggableId={`row-${index}`} index={index}>
                        {(provided) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onDrop={(e) => handleOperationDrop(selectedOperation, index)} // Call handleOperationDrop with the selected operation and target index
                            onDragOver={(e) => e.preventDefault()}
                          >
                            {Object.values(row).map((value, colIndex) => (
                              <TableCell key={colIndex}>{value}</TableCell>
                            ))}
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>
      {/* Operation selection */}
      <Paper className={classes.paper}>
        <Typography variant="h6" component="h2" gutterBottom>
          Operations
        </Typography>
        <div className={classes.operationContainer}>
          <div
            className={classes.operationItem}
            draggable
            onDragStart={() => handleOperationDragStart('addition')}
            onDragEnd={handleOperationDragEnd}
          >
            Addition
          </div>
          <div
            className={classes.operationItem}
            draggable
            onDragStart={() => handleOperationDragStart('subtraction')}
            onDragEnd={handleOperationDragEnd}
          >
            Subtraction
          </div>
          <div
            className={classes.operationItem}
            draggable
            onDragStart={() => handleOperationDragStart('multiplication')}
            onDragEnd={handleOperationDragEnd}
          >
            Multiplication
          </div>
        </div>
      </Paper>
    </Container>
  );
};

export default App;