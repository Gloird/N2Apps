import react,{ useState } from "react";
import { Button } from "react-bootstrap";

export default function MotifCollapse({ motif }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Button
        variant="link"
        size="sm"
        onClick={() => setShow((v) => !v)}
        style={{ padding: 0, marginLeft: 8 }}
      >
        {show ? 'Masquer' : 'Afficher'}
      </Button>
      {show && (
        <div style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: 8, marginTop: 4 }}>
          {motif}
        </div>
      )}
    </div>
  );
}