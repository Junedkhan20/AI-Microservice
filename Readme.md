To run the project: <CODE> npm start (localhost:3000)</CODE>

Api endpoint: <CODE>POST(localhost:3000/patient-query, {
    headers: {
        'x-clinic-id': 'clinic-123'
    }
    body: {
        patientId: UUID,
        query: 'any query'
    }
})</CODE>

To run test: <CODE> npm test </CODE>
