import { useBear } from '@/store';
import './App.css';

function App() {
  const bears = useBear(s => s.bears);
  const setBears = useBear(s => s.updateBears);

  return (
    <>
      <div>
        <button onClick={() => setBears(bears + 1)}>
          bears is {bears}
        </button>
      </div>
    </>
  )
}

export default App
