import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const PositionDetail = () => {
  const { id } = useParams();
  const [positionTitle, setPositionTitle] = useState('');
  const [interviewFlow, setInterviewFlow] = useState([]);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const fetchInterviewFlow = async () => {
      try {
        const response = await fetch(`http://localhost:3010/position/${id}/interviewFlow`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPositionTitle(`${data.interviewFlow.positionName} Position`);
        setInterviewFlow(data.interviewFlow.interviewFlow.interviewSteps || []);
      } catch (error) {
        console.error('Error fetching interview flow:', error);
      }
    };

    const fetchCandidates = async () => {
      try {
        const response = await fetch(`http://localhost:3010/position/${id}/candidates`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCandidates(data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchInterviewFlow();
    fetchCandidates();
  }, [id]);

  const renderScoreCircles = (score) => {
    return Array.from({ length: score }, (_, index) => (
      <span key={index} style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'green', borderRadius: '50%', margin: '2px' }}></span>
    ));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    console.log('Active ID:', active.id);
    console.log('Over ID:', over ? over.id : 'None');

    if (!over) return;

    const activeCandidate = candidates.find(candidate => candidate.fullName === active.id);
    const overStep = interviewFlow.find(step => step.id.toString() === over.id);

    console.log('Active Candidate:', activeCandidate);
    console.log('Over Step:', overStep);

    if (activeCandidate && overStep && activeCandidate.currentInterviewStep !== overStep.name) {
      console.log(`Moving ${activeCandidate.fullName} to ${overStep.name}`);

      const updatedCandidates = candidates.map(candidate =>
        candidate.fullName === activeCandidate.fullName ? { ...candidate, currentInterviewStep: overStep.name } : candidate
      );
      setCandidates(updatedCandidates);

      try {
        const response = await fetch(`http://localhost:3010/candidates/${activeCandidate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applicationId: activeCandidate.id, currentInterviewStep: overStep.id }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update candidate: ${response.statusText}`);
        }

        console.log(`Updated ${activeCandidate.fullName} to ${overStep.name} successfully`);
      } catch (error) {
        console.error('Error updating candidate:', error);
      }
    }
  };

  return (
    <Container style={{ marginTop: '40px' }}>
      <div className="title-container">
        <Link to="/positions" className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} size="2x" />
        </Link>
        <h2 style={{ margin: 0, textAlign: 'center' }}>{positionTitle}</h2>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', overflowX: 'auto', padding: '10px', gap: '10px' }}>
          {interviewFlow.length > 0 ? (
            interviewFlow.map((step) => (
              <SortableContext key={step.id} items={candidates.filter(candidate => candidate.currentInterviewStep === step.name).map(candidate => candidate.fullName)} strategy={verticalListSortingStrategy}>
                <div id={step.id.toString()} style={{ flex: '1 1 300px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '10px', margin: '10px' }}>
                  <h4 style={{ textAlign: 'center' }}>{step.name}</h4>
                  {candidates
                    .filter((candidate) => candidate.currentInterviewStep === step.name)
                    .map((candidate) => (
                      <SortableItem key={candidate.fullName} id={candidate.fullName}>
                        <Card style={{ marginBottom: '10px' }}>
                          <Card.Body>
                            <strong>{candidate.fullName}</strong>
                            <div>{renderScoreCircles(candidate.averageScore)}</div>
                          </Card.Body>
                        </Card>
                      </SortableItem>
                    ))}
                </div>
              </SortableContext>
            ))
          ) : (
            <p>No hay pasos de entrevista disponibles.</p>
          )}
        </div>
      </DndContext>
    </Container>
  );
};

export default PositionDetail;
