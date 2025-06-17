import React, { useEffect, useState } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Tooltip, TextField, InputAdornment, CircularProgress, Chip
} from '@mui/material';
import { Delete, Edit, Search, AllInclusive as AllInclusiveIcon } from '@mui/icons-material';
import axios from 'axios';

const ApiUserTable = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [apiMap, setApiMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [tokensRes, apisRes] = await Promise.all([
        axios.get('/api/apiOrg'),
        axios.get('/api/apis')
      ]);
      const apiObj = Object.fromEntries(apisRes.data.map(api => [api.id, api.name]));
      setApiMap(apiObj);
      setRows(tokensRes.data);
      setFilteredRows(tokensRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredRows(
        rows.filter(row =>
          row.organization.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );      
  }, [searchTerm, rows]);

  const handleDelete = async (id) => {
    await axios.delete(`/api/apiOrg/${id}`);
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper elevation={3} sx={{ flex: 2, p: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search organization..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
      />

      {loading ? (
        <CircularProgress sx={{ m: 2 }} />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>APIs</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.organization}</TableCell>
                  <TableCell>
                    {row.api_ids.map(id => (
                      <Tooltip title={apiMap[id] || id.toString()} key={id}>
                        <Chip label={apiMap[id] || id.toString()} size="small" sx={{ m: 0.25 }} />
                      </Tooltip>
                    ))}
                  </TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {row.expires_at ? new Date(row.expires_at).toLocaleDateString() : <AllInclusiveIcon fontSize="small" />}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(row.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default ApiUserTable;
